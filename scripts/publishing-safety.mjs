import crypto from "node:crypto";
export const BRAND = "CouplesConnect";
export const HANDLE = "couplesconnectindia";
export const normalize = (s) =>
  String(s || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
export function packageHash(pkg) {
  const canonical = (v) =>
    Array.isArray(v)
      ? v.map(canonical)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .map((k) => [k, canonical(v[k])]),
          )
        : v;
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(canonical(pkg)))
    .digest("hex");
}
export function validatePackage(pkg) {
  if (pkg.brand !== BRAND || normalize(pkg.destination) !== HANDLE)
    throw Error("Wrong package identity");
  if (pkg.approved !== true || pkg.status !== "approved")
    throw Error("Package is not approved");
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(pkg.approvalId || ""))
    throw Error("Invalid approval ID");
  const assets = [...(pkg.assets || []), ...(pkg.cleanupAssets || [])];
  if (!pkg.assets?.length) throw Error("Missing assets");
  if (new Set(assets.map((a) => a.key)).size !== assets.length)
    throw Error("Duplicate media key");
  for (const a of assets) {
    if (
      !a.key?.startsWith("couplesconnect-temp-" + pkg.approvalId + "-") ||
      !/^[a-zA-Z0-9._-]+$/.test(a.key) ||
      !/^[a-f0-9]{64}$/.test(a.sha256 || "")
    )
      throw Error("Media must use approval-scoped temporary key and SHA-256");
  }
}
export function validateCommand(pkg, cmd) {
  validatePackage(pkg);
  if (
    cmd.userConfirmedPublish !== true ||
    cmd.confirmation !== "PUBLISH_EXACT_APPROVED_PACKAGE" ||
    cmd.approvalId !== pkg.approvalId ||
    cmd.packageHash !== packageHash(pkg)
  )
    throw Error("Exact package approval mismatch");
}
export function validateChannel(ch, lock) {
  if (
    !lock?.channelId ||
    ch?.id !== lock.channelId ||
    ch.service !== "instagram" ||
    ch.isLocked ||
    ch.isDisconnected ||
    ![ch.name, ch.displayName].some((n) => normalize(n) === HANDLE)
  )
    throw Error("Verified CouplesConnect destination unavailable");
}
export function requireSerializedAction(env, workflow) {
  if (env.GITHUB_ACTIONS !== "true" || env.GITHUB_WORKFLOW !== workflow)
    throw Error("Use the serialized GitHub Actions workflow");
}
export const ledgerKey = (pkg) => "cc-publish-" + pkg.approvalId + ".json";
export function validateLedger(pkg, record) {
  if (
    !record ||
    record.approvalId !== pkg.approvalId ||
    record.packageHash !== packageHash(pkg) ||
    !record.attempted ||
    !record.channelId
  )
    throw Error("Missing or mismatched delivery ledger");
}
export async function claimAttempt(pkg, channel, storage) {
  if (await storage.read(ledgerKey(pkg)))
    throw Error("Publish already attempted; reconcile status, never resubmit");
  const record = {
    approvalId: pkg.approvalId,
    packageHash: packageHash(pkg),
    channelId: channel.id,
    attempted: true,
    status: "attempting",
    attemptedAt: new Date().toISOString(),
  };
  await storage.write(ledgerKey(pkg), record);
  const saved = await storage.read(ledgerKey(pkg));
  validateLedger(pkg, saved);
  if (
    saved.attemptedAt !== record.attemptedAt ||
    saved.channelId !== channel.id
  )
    throw Error("Attempt persistence verification failed");
  return record;
}
export function requireDelivered(pkg, record, post) {
  validateLedger(pkg, record);
  if (
    !record.postId ||
    post?.id !== record.postId ||
    post.status !== "sent" ||
    !post.externalLink
  )
    throw Error("Delivery not confirmed; cleanup refused");
  const u = new URL(post.externalLink);
  if (
    u.protocol !== "https:" ||
    !["instagram.com", "www.instagram.com"].includes(u.hostname) ||
    !/^\/(p|reel)\/[A-Za-z0-9_-]+\/?$/.test(u.pathname)
  )
    throw Error("Invalid Instagram delivery link");
}
