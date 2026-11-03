# CouplesConnect publishing — 3 November 2026

This is the current publishing reference. Earlier BuildWithPankaj documents and
legacy approval/Worker workflows are historical; do not use those paths for
CouplesConnect. The renderer's historical name is infrastructure, not the brand
to put in new content.

Destination: @couplesconnectindia. Never use Metricool or Hi FIFA. The publisher
reads the existing private config-buffer-channel.json and requires its channel ID
to match an active Instagram channel whose current name is couplesconnectindia.
Private identifiers, tokens and signed delivery URLs must never enter this repo.

## Approval and invocation

1. Produce CouplesConnect media and the complete caption/metadata. Retain approved
   originals outside temporary delivery storage. Show the actual final preview.
2. Obtain explicit approval to publish or schedule that exact version. A draft or
   design approval alone does not authorize publication. Any change requires a new
   approval ID and another preview/approval.
3. Use a unique 8–100 character approval ID containing letters, digits, _ or -.
   Hash the approved file bytes with SHA-256. Stage copies in the existing Dropbox
   /BUILDWITHPANKAJ/Instagram-Staging/ folder (historical folder name retained).
   Set the ingest manifest brand to CouplesConnect, require expectedSha256, and
   choose new R2 keys beginning couplesconnect-temp-<approvalId>-.
   Ingest refuses overwrites. Never use originals as temporary delivery keys.
4. Supply publish-package.json with brand CouplesConnect, destination
   @couplesconnectindia, approved true, status approved, approvalId, postType,
   caption and ordered assets (key, type and sha256). Include cleanupAssets only
   for exact additional temporary source objects, also scoped and hashed.
   Reels require one video; carousels require 2–10 images or 2–10 videos, unmixed.
   This existing route allows at most five hashtags. Supply explicit mode
   shareNow or customScheduled/dueAt and schedulingType automatic as approved.
5. Compute packageHash using packageHash() from scripts/publishing-safety.mjs over
   the complete package. Put this in universal-publish-command.json with the
   matching approvalId, userConfirmedPublish true and confirmation
   PUBLISH_EXACT_APPROVED_PACKAGE. Do not reuse a historical command/package.
6. Check previous delivery records first. Use the read-only status workflow if an
   attempt exists. Invoke only the main-branch workflow:
   gh workflow run universal-instagram-publish.yml --ref main
   The existing special commit trigger remains supported, but manual dispatch
   should be preferred. Never dispatch a second attempt after a timeout.
7. Verify sent status and the Instagram link. Acceptance/processing is not live
   delivery. For later reconciliation:
   gh workflow run publish-status-check.yml --ref main
8. After delivery, invoke cleanup-published-r2.yml on main for the unchanged
   approved package. It queries Buffer afresh, checks the ledger and media hashes,
   deletes only approval-scoped temporary R2 keys, and verifies 404 afterward.
   Dropbox temporary-copy cleanup is separate; verify live delivery and exact
   staging paths, observe the Dropbox deletion approval requirements, and retain
   approved originals. Keep the lightweight delivery ledger permanently.

## Duplicate protection and limits

Publishing, ingest and cleanup share a GitHub Actions concurrency group, with
cancel-in-progress false. Run publishing only through this serialized workflow.
The private R2 ledger cc-publish-<approvalId>.json is written and read back BEFORE
Buffer createPost. An existing attempt always blocks resubmission, including
after failure. The returned Buffer post ID is persisted for status checks.
If Buffer accepts a post but its response is lost, the attempt remains blocked;
inspect Buffer history manually and reconcile. Never make a fresh approval ID
just to bypass an ambiguous attempt. This favors avoiding duplicates over
automatic retries. The R2 media route is not an atomic distributed lock: do not
run parallel scripts outside the serialized Actions route.

Cleanup fails closed if status, ledger, identity, link or content hashes do not
match. It cannot clean historical packages that lack the new ledger.

Read-only credential/destination verification:
gh workflow run verify-couplesconnect-destination.yml --ref main
This queries only private configuration and Buffer channels; it does not stage,
publish, schedule, refresh connections or alter the private lock.

Tests use mocked Buffer/private-media services only. They cover Reel/carousel
delivery, repeated invocation, lost Buffer response, approval/content changes,
wrong or disconnected accounts, failed persistence and premature cleanup.

Reusable instruction: Use this Buffer route with CouplesConnect branding. Preview
the exact media and caption; wait for explicit publish/schedule approval. Verify
the destination and earlier attempts, publish once, confirm delivery and return
the Instagram link. Clean only confirmed post-specific temporary copies and
retain approved originals. Stop on uncertainty; never use Hi FIFA.
