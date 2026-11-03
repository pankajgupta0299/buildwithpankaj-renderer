import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { packageHash } from "../scripts/publishing-safety.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
for (const postType of ["reel", "carousel"])
  test(
    postType + ": publish, retry, cleanup and lost-response safeguards",
    () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cc-publish-test-"));
      try {
        const sha256 = crypto
          .createHash("sha256")
          .update("video")
          .digest("hex");
        const pkg = {
          brand: "CouplesConnect",
          destination: "@couplesconnectindia",
          approved: true,
          status: "approved",
          approvalId: "cc-test-0001",
          postType,
          caption: "Approved caption",
          assets: [
            {
              key: "couplesconnect-temp-cc-test-0001-final",
              type: postType === "reel" ? "video" : "image",
              sha256,
            },
          ],
        };
        if (postType === "carousel")
          pkg.assets.push({
            ...pkg.assets[0],
            key: "couplesconnect-temp-cc-test-0001-slide2",
          });
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify(pkg));
        fs.writeFileSync(
          path.join(dir, "command.json"),
          JSON.stringify({
            approvalId: pkg.approvalId,
            userConfirmedPublish: true,
            confirmation: "PUBLISH_EXACT_APPROVED_PACKAGE",
            packageHash: packageHash(pkg),
          }),
        );
        const statePath = path.join(dir, "state.json");
        const state = () =>
          fs.existsSync(statePath)
            ? JSON.parse(fs.readFileSync(statePath))
            : {};
        const run = (script, extra = {}) =>
          spawnSync(
            process.execPath,
            [
              "--import",
              pathToFileURL(path.join(root, "tests/mock-services.mjs")).href,
              path.join(root, "scripts", script),
            ],
            {
              encoding: "utf8",
              env: {
                ...process.env,
                PRIVATE_MEDIA_BASE_URL: "https://media.test",
                PRIVATE_MEDIA_TOKEN: "test-only",
                BUFFER_API_KEY: "test-only",
                PUBLISH_PACKAGE_PATH: path.join(dir, "package.json"),
                PUBLISH_COMMAND_PATH: path.join(dir, "command.json"),
                TEST_STATE: statePath,
                GITHUB_ACTIONS: "true",
                GITHUB_WORKFLOW: script.includes("cleanup")
                  ? "Cleanup Published R2 Media"
                  : "Universal Instagram Publish",
                ...extra,
              },
            },
          );
        assert.equal(run("cleanup-r2-media.mjs").status, 1);
        assert.equal(state().deletes || 0, 0);
        let r = run("universal-instagram-publisher.mjs");
        assert.equal(r.status, 0, r.stderr);
        assert.equal(state().creates, 1);
        assert.equal(run("universal-instagram-publisher.mjs").status, 1);
        assert.equal(state().creates, 1);
        assert.equal(
          run("cleanup-r2-media.mjs", { POST_STATUS: "sending" }).status,
          1,
        );
        assert.equal(state().deletes, 0);
        r = run("cleanup-r2-media.mjs");
        assert.equal(r.status, 0, r.stderr);
        assert.equal(state().deletes, pkg.assets.length);
        fs.unlinkSync(statePath);
        assert.equal(
          run("universal-instagram-publisher.mjs", { LOSE_RESPONSE: "1" })
            .status,
          1,
        );
        assert.equal(run("universal-instagram-publisher.mjs").status, 1);
        assert.equal(state().creates, 1);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    },
  );
