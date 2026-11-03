import fs from "node:fs/promises";
import {
  validatePackage,
  validateLedger,
  ledgerKey,
} from "./publishing-safety.mjs";
import { services, postQuery } from "./publishing-services.mjs";
const pkg = JSON.parse(
  await fs.readFile(
    process.env.PUBLISH_PACKAGE_PATH || "publish-package.json",
    "utf8",
  ),
);
validatePackage(pkg);
const { storage, buffer } = services();
const record = await storage.read(ledgerKey(pkg));
validateLedger(pkg, record);
if (!record.postId) {
  console.log(
    JSON.stringify({
      status: "ambiguous-attempt",
      message: "Inspect Buffer history; never resubmit automatically",
    }),
  );
  process.exitCode = 1;
} else {
  const { post } = await buffer(postQuery, { id: record.postId });
  console.log(
    JSON.stringify({
      approvalId: pkg.approvalId,
      postId: record.postId,
      status: post?.status || "unknown",
      externalLink: post?.externalLink || null,
    }),
  );
}
