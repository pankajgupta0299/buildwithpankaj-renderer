import { services } from "./publishing-services.mjs";
import { validateChannel } from "./publishing-safety.mjs";
const { storage, buffer } = services();
const lock = await storage.read("config-buffer-channel.json");
if (!lock?.channelId || !lock.organizationId)
  throw Error("Private destination lock missing");
const d = await buffer(
  "query Channels($organizationId: OrganizationId!) { channels(input:{organizationId:$organizationId}) {id name displayName service isLocked isDisconnected} }",
  { organizationId: lock.organizationId },
);
validateChannel(
  d.channels?.find((c) => c.id === lock.channelId),
  lock,
);
console.log(
  JSON.stringify({
    ok: true,
    destination: "@couplesconnectindia",
    service: "instagram",
    matchesExistingPrivateLock: true,
    readOnly: true,
  }),
);
