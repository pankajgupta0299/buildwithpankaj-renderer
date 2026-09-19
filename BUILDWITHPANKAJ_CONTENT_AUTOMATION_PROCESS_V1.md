# BuildWithPankaj Content Automation Process V1

Status: **End-to-end publishing proven**
Last verified: **2026-09-19**

This document is the operating reference for the BuildWithPankaj content automation system. It records the current architecture, approval rules, publishing flow, safety controls, free-tier assumptions, operational process, and known follow-up improvements.

---

## 1. Objective

Build a reliable content production and publishing system for **BuildWithPankaj | AI for Professionals** that can:

1. prepare source media privately,
2. render branded short-form content,
3. store drafts privately,
4. require explicit human approval of the exact final asset,
5. publish only after a separate explicit publish command,
6. publish only to the verified BuildWithPankaj Instagram destination,
7. verify platform status,
8. preserve enough state to prevent duplicate or accidental publishing.

The system is deliberately approval-gated. Rendering, preflight, and approval do not by themselves publish anything.

---

## 2. Brand Context

Brand: **BuildWithPankaj**

Instagram: **@buildwith_pankaj**

Display name: **BuildWithPankaj | AI for Professionals**

Mission: **Help professionals become AI builders.**

Core audience:
- managers and team leads,
- consultants and architects,
- Salesforce and marketing automation professionals,
- enterprise technology professionals,
- product managers and technical business analysts,
- curious professionals who want to build with AI without becoming full-time software developers.

Visual direction:
- white,
- charcoal,
- olive green,
- primary olive: **#6B6F2A**,
- minimal, premium, high-whitespace,
- no neon/futuristic AI graphics,
- no cluttered stock-photo style.

---

## 3. Non-Negotiable Approval Rule

The central safety rule is:

> **Never publish, schedule, or send content live until the user has explicitly approved the exact final rendered asset.**

Approval and publishing are separate actions.

A valid content lifecycle is:

```text
draft
→ ready_for_approval
→ approved
→ processing
→ published-live
```

Failure state:

```text
failed
```

Important rules:

- Approval applies to one exact asset and its exact metadata.
- If the rendered asset or caption changes, a new preflight/approval record should be created.
- Approval does not automatically publish.
- Publishing requires a separate explicit user confirmation.
- A caller cannot choose a destination channel ID.
- The destination is loaded from the privately locked BuildWithPankaj Buffer configuration.
- Duplicate publish attempts fail closed.
- Never claim `published-live` unless confirmed by platform status or direct platform verification.

---

## 4. Current Architecture

```text
Private Source Media
        │
        ▼
Cloudflare R2
buildwithpankaj-media
        │
        ▼
Cloudflare Worker
buildwithpankaj-media
        │
        ▼
GitHub Actions
buildwithpankaj-renderer
        │
        ▼
Remotion Render
1080 × 1920 MP4
        │
        ▼
Private R2 Draft
        │
        ▼
Preflight Manifest
ready_for_approval
        │
        ▼
Explicit Human Approval
approved
        │
        ▼
Separate Explicit Publish Command
        │
        ▼
Temporary Signed Media URL
        │
        ▼
Buffer API
exact locked Instagram channel
        │
        ▼
Instagram
@buildwith_pankaj
```

---

## 5. GitHub Repository

Repository:

```text
pankajgupta0299/buildwithpankaj-renderer
```

Repository is public.

Therefore it may contain:
- renderer code,
- layouts,
- animation code,
- generic test content,
- public workflow definitions,
- non-sensitive operational documentation.

It must not contain:
- API keys,
- Cloudflare tokens,
- Buffer credentials,
- private analytics,
- personal/private data,
- sensitive unpublished media,
- raw secrets,
- exact private destination IDs.

GitHub repository secrets currently used:

```text
PRIVATE_MEDIA_BASE_URL
PRIVATE_MEDIA_TOKEN
```

Secret values must never be committed.

---

## 6. Renderer

Renderer stack:
- Remotion,
- React,
- GitHub Actions,
- Node,
- H.264 MP4 output.

Current target output:

```text
1080 × 1920
30 FPS
vertical 9:16
H.264
```

The renderer supports multi-scene content using scene types such as:
- title,
- text,
- media,
- CTA.

It supports:
- images,
- video,
- optional audio,
- timed captions,
- branded footer,
- restrained transitions,
- dynamic duration.

Public repository content must reference private assets using asset IDs, not direct private URLs.

---

## 7. Private Media Boundary

Private media is stored in Cloudflare R2 bucket:

```text
buildwithpankaj-media
```

Cloudflare Worker:

```text
buildwithpankaj-media
```

R2 binding:

```text
MEDIA → buildwithpankaj-media
```

Worker secrets:

```text
MEDIA_AUTH_TOKEN
BUFFER_API_KEY
```

Never store the values in GitHub or documentation.

Private media routes require bearer authentication.

Supported private media operations:

```text
GET  /media/<key>
HEAD /media/<key>
PUT  /media/<key>
```

The private bucket itself remains non-public.

---

## 8. Public Temporary Delivery

Buffer requires a reachable media URL when creating a video post.

The Worker therefore creates a temporary signed route:

```text
/delivery/<key>?exp=<timestamp>&sig=<signature>
```

Properties:
- signed with HMAC,
- time-limited,
- generated only after publishing is explicitly authorized,
- does not make the R2 bucket public,
- supports GET,
- supports HEAD,
- supports ranged reads for video delivery.

The signed URL is temporary infrastructure for Buffer ingestion, not a permanent public asset URL.

---

## 9. Buffer Destination Lock

The BuildWithPankaj Worker discovers Buffer organizations and channels, then finds an exact Instagram match for:

```text
buildwith_pankaj
```

The exact Buffer destination is stored privately in R2:

```text
config-buffer-channel.json
```

Public responses intentionally expose only:

```json
{
  "locked": true,
  "account": "@buildwith_pankaj",
  "service": "instagram"
}
```

They do not expose the actual channel ID.

Critical rule:

> The publish endpoint must never accept a channel ID from the caller.

The Worker loads the locked destination internally.

This prevents accidental publishing to Hi FIFA or any other account that may share the same Buffer API key.

---

## 10. Worker Endpoints

### Public

```text
GET /health
```

Purpose:
- verify Worker availability.

### Private media

```text
GET  /media/<key>
HEAD /media/<key>
PUT  /media/<key>
```

Purpose:
- private source retrieval,
- existence verification,
- rendered draft storage.

### Buffer identity lock

```text
POST /buffer/lock-buildwithpankaj
GET  /buffer/status
```

Purpose:
- discover and lock exact BuildWithPankaj Instagram channel,
- verify the lock without exposing private channel ID.

### Approval preflight

```text
POST /publish/preflight
```

Purpose:
- verify draft exists,
- verify Buffer destination lock exists,
- create private approval manifest,
- mark status `ready_for_approval`.

This endpoint does not publish.

### Explicit approval

```text
POST /publish/approve
```

Purpose:
- approve one exact preflight manifest,
- verify correct brand/destination,
- verify draft still exists,
- reject already-attempted publishing.

Required confirmation phrase:

```text
APPROVE_EXACT_ASSET
```

This endpoint does not publish.

### Execute publishing

```text
POST /publish/execute
```

Purpose:
- require an already-approved exact manifest,
- re-check Buffer channel lock,
- verify draft still exists,
- prevent duplicate execution,
- generate temporary signed delivery URL,
- call Buffer,
- record Buffer state.

Required confirmation phrase:

```text
PUBLISH_EXACT_APPROVED_ASSET
```

### Publish status

```text
GET /publish/status?approvalId=<id>
```

Purpose:
- query current publication state,
- update private manifest,
- report processing / live / failure status.

---

## 11. Approval Manifest

Each preflight creates a private R2 record similar to:

```text
approval-<approvalId>.json
```

The manifest stores:
- approval ID,
- brand,
- locked destination,
- content type,
- draft asset key,
- caption,
- approval status,
- timestamps,
- publishing attempt state,
- Buffer post ID,
- Buffer status,
- external link when available,
- failure state when relevant.

Initial state:

```text
status: ready_for_approval
approved: false
publishing.attempted: false
published: false
```

After approval:

```text
status: approved
approved: true
publishing.attempted: false
published: false
```

After publish execution begins:

```text
status: publishing / processing
publishing.attempted: true
```

After confirmed publication:

```text
status: published-live
published: true
```

---

## 12. GitHub Workflows

### Render pipeline

Purpose:
- validate content,
- resolve private assets,
- render Remotion video,
- upload output to private R2,
- verify upload,
- clean temporary runner files.

Private rendered draft naming pattern:

```text
draft-run-<github-run-id>.mp4
```

### Buffer discovery

Purpose:
- call exact-channel lock endpoint,
- verify lock.

### Publish preflight

Purpose:
- create private ready-for-approval manifest.

### Exact asset approval

Purpose:
- validate explicit approval command,
- call Worker approval endpoint.

### Approval negative test

Purpose:
- prove invalid confirmation is rejected.

### Publish readiness test

Purpose:
- verify approved asset remains available,
- verify invalid publish confirmation is rejected,
- confirm no accidental publication.

### Publish approved asset

Purpose:
- validate separate explicit publish command,
- call `/publish/execute`,
- poll `/publish/status`.

### Publish status check

Purpose:
- query current Worker/Buffer publication state without publishing again.

---

## 13. Verified End-to-End Test

The system has been tested through the complete real publishing path.

Verified sequence:

```text
Private R2 source
→ Worker authenticated retrieval
→ GitHub Actions
→ Remotion
→ private R2 draft
→ Buffer exact-channel lock
→ preflight
→ explicit approval
→ explicit publish confirmation
→ temporary signed video delivery
→ Buffer create-post flow
→ Instagram @buildwith_pankaj
```

Result:
- Buffer accepted the post,
- Buffer entered `sending`,
- Instagram successfully published the Reel,
- the user manually verified the Instagram post,
- the user subsequently deleted the test post.

This proves that the core production path works end to end.

---

## 14. Important Status Nuance

During the first real test, Buffer continued reporting:

```text
sending
```

for a period even though the Instagram Reel was already live.

Therefore:

- Buffer status should not be treated as perfectly real-time.
- Do not mark failure merely because `sending` persists briefly.
- Future status reconciliation should improve by combining:
  - Buffer status,
  - external link when available,
  - optional Instagram-side verification.

Until improved, the safest state is:

```text
processing
```

until live publication can be confirmed.

---

## 15. Duplicate Protection

Publishing is designed to fail closed.

Before calling Buffer, the manifest is marked:

```text
publishing.attempted: true
```

If the same approval ID is executed again, the Worker should refuse the duplicate rather than create another post.

If a post is already marked published, repeated calls should return the existing published state instead of creating a second post.

This is especially important because network failures can occur after Buffer has already accepted the request.

---

## 16. Separation From Hi FIFA

BuildWithPankaj and Hi FIFA may share some account-level infrastructure, but their publishing identities must remain isolated.

BuildWithPankaj resources:

```text
GitHub:
pankajgupta0299/buildwithpankaj-renderer

Cloudflare Worker:
buildwithpankaj-media

R2:
buildwithpankaj-media

Instagram:
@buildwith_pankaj
```

Never:
- use Hi FIFA channel IDs,
- use Hi FIFA R2 keys,
- publish through the Hi FIFA Worker,
- accept arbitrary destination IDs in BuildWithPankaj requests.

---

## 17. Free-First Operating Rule

The project follows a free-first architecture.

Before materially increasing usage or adding a new provider:
1. re-check current free-tier limits,
2. verify commercial-use terms,
3. verify API/action access is actually included,
4. estimate expected monthly usage,
5. warn before approaching paid limits,
6. fail closed where practical,
7. do not knowingly create paid usage without explicit user approval.

Do not assume that a free product account automatically includes every API feature.

---

## 18. Normal Content Operating Flow

For real content, use this operating process:

```text
1. DISCOVER / SOURCE
2. FILTER
3. RESEARCH / VERIFY
4. ORIGINAL BUILDWITHPANKAJ ANGLE
5. SCRIPT / STORYBOARD
6. PREPARE PRIVATE SOURCE ASSETS
7. RENDER
8. REVIEW FINAL MP4
9. PREPARE CAPTION / CTA / METADATA
10. PREFLIGHT
11. SHOW EXACT FINAL ASSET TO USER
12. EXPLICIT APPROVAL
13. EXPLICIT PUBLISH COMMAND
14. BUFFER
15. INSTAGRAM
16. VERIFY LIVE
17. COLLECT PERFORMANCE
18. LEARN AND IMPROVE
```

External content is an input, not an output.

Do not repost third-party content or remove watermarks.

Use external research to create:
- original explanation,
- original examples,
- original demonstrations,
- original commentary,
- BuildWithPankaj-specific angle.

---

## 19. Performance Feedback Loop

After publication, evaluate at approximately:
- 24 hours,
- 72 hours,
- 7 days.

Track where available:
- reach,
- plays/views,
- watch time,
- retention,
- likes,
- comments,
- saves,
- shares,
- profile visits,
- follows,
- link clicks,
- conversions.

Also tag creative variables:
- topic,
- pillar,
- hook,
- format,
- length,
- opening,
- CTA,
- faceless vs face,
- screenshot vs demo,
- screen recording,
- educational vs opinion,
- build-in-public.

Use BuildWithPankaj's own performance data as the primary optimization signal.

Do not change core brand positioning merely because one post underperforms.

---

## 20. Remaining Production Improvements

The core system works. The following items are improvements, not blockers.

### A. R2 cleanup

Current drafts and approval manifests can accumulate.

Future improvement:
- add a retention/lifecycle strategy,
- delete stale drafts after a safe period,
- retain published manifests longer for audit history,
- never delete an asset that is still being delivered to Buffer.

### B. Status reconciliation

Improve detection when Buffer remains `sending` after Instagram is already live.

### C. Test-file cleanup

Temporary trigger/command files and one-off test workflows should be reduced or clearly separated from production operations once the stable production interface is finalized.

### D. Immutable content identity

For stronger long-term guarantees, bind approval to a content hash covering:
- rendered MP4,
- caption,
- metadata.

Any change would produce a new identity and invalidate prior approval.

### E. Analytics automation

Future phase:
- retrieve Instagram performance,
- store post-level metrics,
- compare hooks/formats,
- feed learnings back into content planning.

---

## 21. Security Rules

Never:
- expose `MEDIA_AUTH_TOKEN`,
- expose `BUFFER_API_KEY`,
- commit private channel IDs,
- commit sensitive unpublished media,
- accept arbitrary publishing destinations,
- auto-publish from pull requests,
- use `pull_request_target` with secrets,
- expose approval records publicly,
- publish merely because a render succeeded.

Keep GitHub Actions permissions minimal.

Current workflows should use:

```yaml
permissions:
  contents: read
```

unless a workflow specifically requires more.

---

## 22. Operational Definition of Done

A content item is not complete when rendered.

It is complete only when:

```text
final asset reviewed
+ exact asset approved
+ publish explicitly authorized
+ Buffer accepted
+ Instagram verified live
+ final status recorded
```

For test content, if it is intentionally deleted after verification, document that deletion rather than treating the post as a production asset.

---

## 23. Current Project State

As of 2026-09-19:

- Renderer: **working**
- Private media retrieval: **working**
- Private rendered output storage: **working**
- Buffer exact account discovery: **working**
- BuildWithPankaj destination lock: **working**
- Preflight: **working**
- Explicit approval gate: **working**
- Negative approval test: **working**
- Separate publish confirmation: **working**
- Signed temporary media delivery: **working**
- Buffer create-post path: **working**
- Instagram publication: **verified in production test**
- Duplicate protection: **implemented**
- Status polling: **working, but Buffer can lag**
- Analytics automation: **not yet implemented**
- Automated R2 cleanup: **not yet implemented**

The infrastructure is sufficiently proven to stop infrastructure-first experimentation and move into real BuildWithPankaj content production.

---

## 24. Next Phase

The next phase should focus on actual content rather than more platform engineering.

Recommended sequence:

```text
Choose next real BuildWithPankaj topic
→ research/verify
→ create script/storyboard
→ prepare media
→ render
→ show final asset
→ user approval
→ publish through proven pipeline
→ measure performance
```

Infrastructure changes should now be made only when a real content requirement exposes a specific limitation.

---

## 25. Version History

### V1 — 2026-09-19

Established and production-tested:
- private media boundary,
- public GitHub Remotion renderer,
- private R2 rendered drafts,
- exact Buffer destination lock,
- preflight manifest,
- explicit exact-asset approval,
- separate explicit publish confirmation,
- temporary signed media delivery,
- Buffer-to-Instagram publishing,
- live Instagram verification,
- duplicate protection,
- operational status model.

First real automation test successfully published to @buildwith_pankaj and was subsequently deleted manually after verification.
