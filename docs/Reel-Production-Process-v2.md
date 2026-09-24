# BuildWithPankaj — Reel Production Process

**Version:** 2.3  
**Updated:** 2026-09-24  
**Status:** Active process; every individual Reel still needs its own approval.

## Scope and editorial rules

BuildWithPankaj teaches anyone to build anything with AI through clear, practical projects. See `docs/Channel-Positioning.md` for the current mission, audience, profile copy, and content pillars. Projects may include apps, games, websites, automations, personal tools, and creative experiments. Workplace examples are one option, not the default or a requirement. Choose a topic because it gives the viewer a clear insight, useful demonstration, or reason to try something. Open by stating what the viewer will learn or build, then show the essential creation steps and a working result. Do not make a Reel about Pankaj's private publishing or automation setup unless he explicitly asks to share it.

Use the existing brand identity and design system: olive, white, charcoal; clear typography; purposeful, unhurried motion. Claims about products, features, availability, or current events need current source checks. Demonstrations must distinguish actual results from illustrative mockups. Do not imply Pankaj personally tested a tool unless he did.

## One Reel, from idea to publication

| Step | Owner/action | Output and gate |
| --- | --- | --- |
| 1. Find a strong topic | Assistant researches timely or evergreen ideas, checks facts where needed, and proposes a specific viewer takeaway and visual treatment. | Pankaj selects or approves a concept. A rejected topic is retired; the production process remains reusable. |
| 2. Shape the story | Assistant writes the hook, one central idea, scene-by-scene narration and visuals, and a fitting ending. Keep the promise specific and the script conversational. | Concept and angle approved before a full render. Do not invent personal experience or reveal private systems. |
| 3. Plan scene timing | Build a scene map with narration, on-screen text, visual action, and estimated seconds for each beat. Let the content determine the total length. | Each line has a corresponding visual; enough time to read text and understand the point. |
| 4. Produce voice and visuals | Generate the approved Google TTS voice, currently the preferred Chirp 3 HD voice, in scene-sized segments. Use images, UI demonstrations, motion, and captions only when they clarify the story. | Natural voice quality; visuals and speech aligned by scene. Do not rush the voice to hit an arbitrary Reel duration. |
| 5. Render a private draft | Measure the actual duration of every voice segment; give each scene a readable hold after speech. Add original music quietly underneath when it helps. Render a vertical 1080 × 1920 MP4. | Private draft only. Label versions so the reviewed file can be identified exactly. |
| 6. Quality check | Watch the whole MP4 with sound at normal speed, especially on a phone-sized view. Check the hook, pace, pronunciation, every transition, scene synchronization, legibility, audio balance, spelling, factual claims, final frame, and whether the video feels worth watching. | Fix defects and render a new version before sending a preview. Technical duration checks alone do not replace watching and listening. |
| 7. Private review | Send Pankaj the exact rendered MP4 in chat and invite feedback on topic, pace, voice, visuals, and content. | Pankaj may approve, request changes, or reject the topic. Any revised cut gets its own review. Concept approval does not approve an MP4. |
| 8. Publish | Only after Pankaj approves the **exact final MP4** for publishing, prepare caption, cover, and hashtags, then use the configured publishing flow. Verify the resulting Instagram post and report the live link. | Publication approval is separate from approval to render or privately transfer a draft. If the publish path is unavailable, report the obstacle; never claim a post is live without verification. |
| 9. Clean up and learn | After a post is confirmed live **or a concept/asset is rejected**, inventory and remove its temporary render inputs, review copies, and private staging objects from scratch, Dropbox, R2, and any workflow artifacts. Record feedback for the next Reel. | Verify the exact files and keys, delete only the affected Reel's disposable media, and confirm deletion in each location. Preserve published assets, reusable source/code, and records needed for audit or recovery. |

## Cleanup procedure for published and rejected Reels

1. **Establish status.** For a published Reel, verify it is live before removing delivery media. For a rejected Reel, record that the concept or exact draft was rejected and confirm it is not queued, publishing, or needed for a revision. Do not run the publish workflow for a rejected draft.
2. **Inventory exact targets.** Match local files, Dropbox staging/review copies, R2 object keys, and any workflow artifacts to the specific Reel and version. Use render run IDs to identify R2 `draft-run-<run-id>.mp4` keys. Exclude other posts and reusable project files. Check sharing and confirm exact Dropbox paths before deletion.
3. **Delete and verify by location.** Pankaj's standing instruction authorizes routine cleanup of unambiguously disposable Reel files after verified publication or rejection; do not request the same cleanup approval each time. Remove exact local exports and preview images; delete exact Dropbox staging/review files after checking metadata and sharing, then verify they are gone; delete each exact R2 object using the authenticated route and verify a `HEAD` returns `404`. Check workflow artifacts only if the run produced them. Ask Pankaj only when an item is ambiguous, shared directly, needed for an active revision, or outside this routine scope. Report successes and remaining items separately.
4. **Keep credentials private.** Run R2 deletion inside the existing credentialed environment. Never print a bearer token or signed media URL into public logs. For a rejected draft, use an exact-key, one-time cleanup rather than the approved publish package, which can point to a different Reel; restore the normal cleanup code afterward.
5. **Close the loop.** Record the deleted paths/keys and verification result. Retain the approved master if required, the live link, lightweight metadata, and reusable source/code. If any deletion cannot be verified, mark cleanup incomplete and retry only that location; never claim full cleanup early.

The rejected Reel #4 cleanup established this separate path: its three Dropbox review copies and local exports were removed, then R2 deleted `draft-run-35863604573.mp4`, `draft-run-35864721504.mp4`, and `draft-run-35885337813.mp4` (each returned deletion `200` and verification `HEAD 404`). The standard R2 cleanup script was restored after that one-time run.

## Pace and synchronization standard

- Prefer normal conversational delivery. The improved Chirp 3 HD voice is the current starting point; judge its *actual sound* in each draft.
- Never force six scenes into a fixed 18-second template. Leave time for the viewer to absorb a before/after, a screenshot, or a new concept. A longer Reel is acceptable when it makes the story clearer.
- A line of narration should begin as its matching visual appears. Hold the relevant visual through the spoken line and briefly afterward. If a visual needs substantial reading, allocate more time or simplify it.
- If slowing an existing cut, adjust sound and picture together and preserve voice pitch; review the resulting audio for artifacts. For new renders, prefer pacing the script, voice segments, and scene holds from the start.
- Use captions or highlighted keywords when helpful, but verify they follow speech and do not crowd the phone-safe area.

## Decision record from the current iteration

- The meeting-notes concept and both of its draft cuts are **rejected**. Do not publish or reuse the topic as the next Reel.
- The previous draft demonstrated a better voice option, scene-based narration, synced visuals, private draft transfer, and exact-file review. Keep those process improvements.
- The 18-second cut was too fast. The later 23-second cut did not rescue the topic. Future work starts with a stronger subject and deliberately comfortable pacing.
- No rejected draft is authorized for publication. Use a newly approved concept and a newly approved final asset.

## Roles and approvals

The assistant owns research, creative direction, writing, production, technical checks, revisions, and preparing the publishing materials. Pankaj chooses the direction and has the final say on the rendered Reel and publication. Ordinary production and private review may proceed after concept approval; any platform access request should name the precise action and destination. If access or a configured workflow is blocked, finish whatever can be done safely and explain the specific blocker.
