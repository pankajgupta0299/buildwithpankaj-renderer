import test from "node:test";
import assert from "node:assert/strict";
import {
  packageHash,
  validateCommand,
  validateChannel,
  requireDelivered,
  claimAttempt,
} from "../scripts/publishing-safety.mjs";
const pkg = {
  brand: "CouplesConnect",
  destination: "@couplesconnectindia",
  approved: true,
  status: "approved",
  approvalId: "cc-test-0001",
  postType: "reel",
  caption: "Approved caption",
  assets: [
    {
      key: "couplesconnect-temp-cc-test-0001-final.mp4",
      type: "video",
      sha256: "a".repeat(64),
    },
  ],
};
const cmd = (p) => ({
  approvalId: p.approvalId,
  userConfirmedPublish: true,
  confirmation: "PUBLISH_EXACT_APPROVED_PACKAGE",
  packageHash: packageHash(p),
});
test("approval binds caption, media and scheduling metadata", () => {
  validateCommand(pkg, cmd(pkg));
  for (const p of [
    { ...pkg, caption: "changed" },
    { ...pkg, assets: [{ ...pkg.assets[0], sha256: "b".repeat(64) }] },
    { ...pkg, mode: "customScheduled", dueAt: "2030-01-01" },
  ])
    assert.throws(() => validateCommand(p, cmd(pkg)));
});
test("old brand, wrong account and original files fail closed", () => {
  for (const p of [
    { ...pkg, brand: "BuildWithPankaj" },
    { ...pkg, destination: "@hififaa" },
    { ...pkg, assets: [{ ...pkg.assets[0], key: "approved-original.mp4" }] },
  ])
    assert.throws(() => validateCommand(p, cmd(p)));
});
test("channel needs locked ID, current handle and active Instagram", () => {
  const ch = {
    id: "locked",
    service: "instagram",
    name: "couplesconnectindia",
  };
  validateChannel(ch, { channelId: "locked" });
  for (const c of [
    { ...ch, id: "other" },
    { ...ch, name: "buildwith_pankaj" },
    { ...ch, isDisconnected: true },
    { ...ch, isLocked: true },
    { ...ch, service: "youtube" },
  ])
    assert.throws(() => validateChannel(c, { channelId: "locked" }));
});
test("durable claim refuses second attempt, even with changed package", async () => {
  const values = new Map();
  const storage = {
    read: async (k) => values.get(k),
    write: async (k, v) => values.set(k, v),
  };
  await claimAttempt(pkg, { id: "locked" }, storage);
  await assert.rejects(claimAttempt(pkg, { id: "locked" }, storage));
  await assert.rejects(
    claimAttempt({ ...pkg, caption: "changed" }, { id: "locked" }, storage),
  );
});
test("failed persistence prevents claiming an attempt", async () => {
  await assert.rejects(
    claimAttempt(
      pkg,
      { id: "locked" },
      {
        read: async () => null,
        write: async () => {
          throw Error("unavailable");
        },
      },
    ),
  );
  await assert.rejects(
    claimAttempt(
      pkg,
      { id: "locked" },
      { read: async () => null, write: async () => {} },
    ),
  );
});
test("cleanup needs matching ledger, sent post and Instagram link", () => {
  const r = {
    approvalId: pkg.approvalId,
    packageHash: packageHash(pkg),
    attempted: true,
    channelId: "locked",
    postId: "post1",
  };
  const p = {
    id: "post1",
    status: "sent",
    externalLink: "https://www.instagram.com/reel/example/",
  };
  requireDelivered(pkg, r, p);
  for (const post of [
    { ...p, status: "sending" },
    { ...p, status: "error" },
    { ...p, id: "other" },
    { ...p, externalLink: null },
    { ...p, externalLink: "https://evil.test/reel/example/" },
  ])
    assert.throws(() => requireDelivered(pkg, r, post));
  assert.throws(() => requireDelivered({ ...pkg, caption: "changed" }, r, p));
});
