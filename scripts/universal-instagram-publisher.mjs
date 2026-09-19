import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const PKG_PATH = process.env.PUBLISH_PACKAGE_PATH || 'publish-package.json';
const CMD_PATH = process.env.PUBLISH_COMMAND_PATH || 'universal-publish-command.json';
const BASE = process.env.PRIVATE_MEDIA_BASE_URL;
const MEDIA_TOKEN = process.env.PRIVATE_MEDIA_TOKEN;
const BUFFER_TOKEN = process.env.BUFFER_API_KEY;

const required = (value, name) => {
  if (!value) throw new Error(`Missing required value: ${name}`);
  return value;
};

required(BASE, 'PRIVATE_MEDIA_BASE_URL');
required(MEDIA_TOKEN, 'PRIVATE_MEDIA_TOKEN');
required(BUFFER_TOKEN, 'BUFFER_API_KEY');

const pkg = JSON.parse(await fs.readFile(PKG_PATH, 'utf8'));
const cmd = JSON.parse(await fs.readFile(CMD_PATH, 'utf8'));

if (cmd.userConfirmedPublish !== true) throw new Error('userConfirmedPublish must be true');
if (cmd.confirmation !== 'PUBLISH_EXACT_APPROVED_PACKAGE') throw new Error('Invalid confirmation phrase');
if (!pkg.approved || pkg.status !== 'approved') throw new Error('Package is not approved');
if (!pkg.approvalId || cmd.approvalId !== pkg.approvalId) throw new Error('approvalId mismatch');
if (pkg.brand !== 'BuildWithPankaj') throw new Error('Wrong brand');
if (pkg.destination !== '@buildwith_pankaj') throw new Error('Wrong destination');

const normalize = (s='') => String(s).trim().replace(/^@/,'').toLowerCase();

async function buffer(query, variables = {}) {
  const r = await fetch('https://api.buffer.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BUFFER_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await r.json();
  if (!r.ok) throw new Error(`Buffer HTTP ${r.status}: ${JSON.stringify(body)}`);
  if (body.errors?.length) throw new Error(`Buffer GraphQL: ${JSON.stringify(body.errors)}`);
  return body.data;
}

async function exactChannel() {
  const account = await buffer(`
    query Account {
      account {
        organizations { id name }
      }
    }
  `);
  const matches = [];
  for (const org of account.account.organizations || []) {
    const d = await buffer(`
      query Channels($organizationId: OrganizationId!) {
        channels(input: { organizationId: $organizationId }) {
          id name displayName service isLocked isDisconnected
        }
      }
    `, { organizationId: org.id });
    for (const ch of d.channels || []) {
      if (
        ch.service === 'instagram' &&
        !ch.isLocked &&
        !ch.isDisconnected &&
        [normalize(ch.name), normalize(ch.displayName)].includes('buildwith_pankaj')
      ) {
        matches.push({ ...ch, organizationId: org.id });
      }
    }
  }
  if (matches.length !== 1) throw new Error(`Expected exactly one active @buildwith_pankaj Instagram channel; found ${matches.length}`);
  return matches[0];
}

function signedDelivery(key, expiresAt) {
  const exp = Math.floor(expiresAt.getTime() / 1000);
  const sig = crypto.createHmac('sha256', MEDIA_TOKEN)
    .update(`${key}:${exp}`)
    .digest('base64url');
  return `${BASE}/delivery/${encodeURIComponent(key)}?exp=${exp}&sig=${sig}`;
}

async function verifyPrivateAsset(key) {
  const r = await fetch(`${BASE}/media/${encodeURIComponent(key)}`, {
    method: 'HEAD',
    headers: { Authorization: `Bearer ${MEDIA_TOKEN}` },
  });
  if (!r.ok) throw new Error(`Private media missing: ${key} (HTTP ${r.status})`);
}

function expiryForPackage() {
  const now = Date.now();
  if (pkg.mode === 'customScheduled' && pkg.dueAt) {
    const due = new Date(pkg.dueAt).getTime();
    if (!Number.isFinite(due)) throw new Error('Invalid dueAt');
    return new Date(Math.max(now + 48*3600e3, due + 48*3600e3));
  }
  // Long enough for Buffer ingestion / notification handoff, while keeping R2 private by default.
  return new Date(now + 72*3600e3);
}

const assets = Array.isArray(pkg.assets) ? pkg.assets : [];
if (!assets.length) throw new Error('Package must contain at least one asset');
if (assets.length > 10) throw new Error('Buffer/Instagram third-party carousel limit is 10 assets');

const hashtagCount = ((pkg.caption || '').match(/#[\p{L}\p{N}_]+/gu) || []).length;
if (hashtagCount > 5) {
  throw new Error(`Instagram currently allows a maximum of 5 hashtags per post through this publishing path; found ${hashtagCount}`);
}

const exp = expiryForPackage();
const gqlAssets = [];
for (const asset of assets) {
  if (!asset.key || !['image','video'].includes(asset.type)) throw new Error('Each asset needs key and type=image|video');
  await verifyPrivateAsset(asset.key);
  const url = signedDelivery(asset.key, exp);
  if (asset.type === 'image') {
    const image = { url };
    if (asset.altText || asset.userTags?.length) {
      image.metadata = {
        altText: asset.altText || '',
        ...(asset.userTags?.length ? { userTags: asset.userTags } : {}),
      };
    }
    gqlAssets.push({ image });
  } else {
    const video = { url };
    if (Number.isInteger(asset.thumbnailOffset)) {
      video.metadata = { thumbnailOffset: asset.thumbnailOffset };
    }
    gqlAssets.push({ video });
  }
}

const typeMap = {
  post: 'post',
  carousel: 'post',
  reel: 'reel',
  story: 'story',
};
const instagramType = typeMap[pkg.postType];
if (!instagramType) throw new Error(`Unsupported Instagram postType: ${pkg.postType}`);
if (pkg.postType === 'reel' && (assets.length !== 1 || assets[0].type !== 'video')) {
  throw new Error('Reel requires exactly one video asset');
}
if (pkg.postType === 'story' && assets.length !== 1) {
  throw new Error('Story requires exactly one image or video asset');
}
if (pkg.postType === 'carousel' && assets.length < 2) {
  throw new Error('Carousel requires at least two assets');
}
if (pkg.postType === 'carousel') {
  const kinds = new Set(assets.map(a => a.type));
  if (kinds.size !== 1) {
    throw new Error('Instagram carousels through Buffer cannot mix images and videos');
  }
}

const schedulingType = pkg.schedulingType || 'automatic';
if (!['automatic','notification'].includes(schedulingType)) throw new Error('Invalid schedulingType');

const instagram = {
  type: instagramType,
  shouldShareToFeed: pkg.shouldShareToFeed ?? (pkg.postType !== 'story'),
  isAiGenerated: pkg.isAiGenerated ?? false,
};
if (pkg.firstComment) instagram.firstComment = pkg.firstComment;
if (pkg.geolocation) instagram.geolocation = pkg.geolocation;
if (schedulingType === 'notification' && pkg.stickerFields) instagram.stickerFields = pkg.stickerFields;

const input = {
  text: pkg.postType === 'story' ? (pkg.caption || '') : (pkg.caption || ''),
  channelId: '',
  schedulingType,
  mode: pkg.mode || 'shareNow',
  assets: gqlAssets,
  metadata: { instagram },
  aiAssisted: true,
  needsApproval: false,
  saveToDraft: false,
};
if (input.mode === 'customScheduled') {
  if (!pkg.dueAt) throw new Error('customScheduled requires dueAt');
  input.dueAt = pkg.dueAt;
}

const channel = await exactChannel();
input.channelId = channel.id;

const created = await buffer(`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess {
        post {
          id status dueAt externalLink schedulingType shareMode
          assets { id mimeType source }
        }
      }
      ... on MutationError { message }
    }
  }
`, { input });

const payload = created.createPost;
if (!payload?.post) throw new Error(`Buffer createPost failed: ${payload?.message || JSON.stringify(payload)}`);
const postId = payload.post.id;
console.log(JSON.stringify({
  ok: true,
  phase: 'accepted',
  approvalId: pkg.approvalId,
  postType: pkg.postType,
  assetCount: assets.length,
  schedulingType,
  bufferStatus: payload.post.status,
  postId,
}, null, 2));

if (schedulingType === 'notification' || input.mode !== 'shareNow') {
  process.exit(0);
}

for (let i = 1; i <= 8; i++) {
  await new Promise(r => setTimeout(r, 15000));
  const p = await buffer(`
    query Post($id: PostId!) {
      post(input: { id: $id }) {
        id status externalLink sentAt error { message }
      }
    }
  `, { id: postId });
  const post = p.post;
  console.log(JSON.stringify({
    phase: 'status',
    attempt: i,
    status: post?.status,
    externalLink: post?.externalLink || null,
    error: post?.error?.message || null,
  }));
  if (post?.status === 'sent') {
    console.log(JSON.stringify({ ok: true, status: 'published-live', externalLink: post.externalLink || null }));
    process.exit(0);
  }
  if (post?.status === 'error') {
    throw new Error(`Buffer publication failed: ${post?.error?.message || 'unknown error'}`);
  }
}
console.log(JSON.stringify({ ok: true, status: 'processing', postId }));
