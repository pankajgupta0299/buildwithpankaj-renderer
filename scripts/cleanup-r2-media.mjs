import fs from "node:fs/promises";
import {
  validatePackage,
  requireSerializedAction,
  validateChannel,
  requireDelivered,
  ledgerKey,
} from "./publishing-safety.mjs";
import { services, postQuery } from "./publishing-services.mjs";
requireSerializedAction(process.env, "Cleanup Published R2 Media");
const pkg = JSON.parse(
  await fs.readFile(
    process.env.PUBLISH_PACKAGE_PATH || "publish-package.json",
    "utf8",
  ),
);
validatePackage(pkg);
const { storage, buffer, media, verifyAsset } = services();
const record = await storage.read(ledgerKey(pkg));
const lock = await storage.read("config-buffer-channel.json");
const channels = await buffer(
  "query Channels($organizationId: OrganizationId!) { channels(input:{organizationId:$organizationId}) {id name displayName service isLocked isDisconnected} }",
  { organizationId: lock?.organizationId },
);
validateChannel(
  channels.channels?.find((c) => c.id === record?.channelId),
  lock,
);
const result = await buffer(postQuery, { id: record?.postId });
requireDelivered(pkg, record, result.post);
const assets = [...pkg.assets, ...(pkg.cleanupAssets || [])];
// Validate all existing objects before deleting any. Missing objects permit cleanup retry.
for (const a of assets) {
  const r = await media(a.key, "HEAD");
  if (r.status !== 404) {
    if (!r.ok) throw Error("Media precheck failed");
    await verifyAsset(a);
  }
}
for (const a of assets) {
  const r = await media(a.key, "DELETE");
  if (!r.ok && r.status !== 404) throw Error("Temporary media deletion failed");
  const h = await media(a.key, "HEAD");
  if (h.status !== 404) throw Error("Temporary media deletion not confirmed");
}
record.cleanedAt = new Date().toISOString();
await storage.write(ledgerKey(pkg), record);
console.log(
  JSON.stringify({
    ok: true,
    status: "temporary-media-cleaned",
    count: assets.length,
  }),
);
