const BUFFER_TOKEN = process.env.BUFFER_API_KEY;
if (!BUFFER_TOKEN) throw new Error('Missing BUFFER_API_KEY');

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
      account { organizations { id name } }
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
      ) matches.push(ch);
    }
  }
  if (matches.length !== 1) throw new Error(`Expected one @buildwith_pankaj Instagram channel; found ${matches.length}`);
  return matches[0];
}

const channel = await exactChannel();
const type = process.argv[2] === 'originalSound' ? 'originalSound' : 'music';
const data = await buffer(`
  query TrendingInstagramAudio($input: TrendingInstagramAudioInput!) {
    trendingInstagramAudio(input: $input) {
      ... on SearchInstagramAudioSuccess {
        audio {
          id
          title
          displayArtist
          creatorUsername
          type
          duration
          previewUrl
          coverArtworkUrl
        }
      }
      ... on ChannelRefreshRequired {
        message
        channelIds
      }
    }
  }
`, { input: { channelId: channel.id, audioType: type } });

console.log(JSON.stringify({
  ok: true,
  account: '@buildwith_pankaj',
  audioType: type,
  result: data.trendingInstagramAudio,
}, null, 2));
