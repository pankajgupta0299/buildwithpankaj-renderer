# Universal Instagram Publishing V2

This extends the BuildWithPankaj publisher beyond Reels while preserving the existing approval gate.

Supported package types:
- `post`: one image or video
- `carousel`: 2–10 image/video assets
- `reel`: exactly one video
- `story`: exactly one image or video

Publishing modes:
- `automatic`: direct publishing when Buffer/Instagram support the requested feature.
- `notification`: Buffer notification handoff for Instagram-native features that APIs cannot reliably attach automatically.
- `shareNow`: publish immediately.
- `customScheduled`: publish at `dueAt`.

Optional metadata:
- caption
- firstComment
- alt text per image
- Instagram user tags per image
- geolocation
- Reel share-to-feed flag
- AI-generated disclosure
- notification sticker fields

## Music

The Buffer API can discover trending Instagram audio, but its public CreatePost schema does not expose a general licensed-music field for ordinary Instagram posts/carousels. Therefore:

- Original/royalty-free audio may be baked into video before publishing.
- Trending Instagram-native music remains a native/notification workflow unless the connected publishing provider exposes supported audio metadata.
- Carousel/photo posts cannot have an audio track baked into static images without changing the approved asset into video.
- Never silently substitute a copyrighted track.

## Asset privacy

Packages reference private R2 keys. The publisher:
1. verifies each private asset exists,
2. creates temporary signed delivery URLs,
3. sends those temporary URLs to Buffer,
4. keeps the R2 bucket private.

Do not commit private media into the public GitHub repository.

## Approval contract

Publishing requires all of:
- package `approved: true`
- package `status: "approved"`
- matching approval ID in `universal-publish-command.json`
- `userConfirmedPublish: true`
- confirmation phrase `PUBLISH_EXACT_APPROVED_PACKAGE`
- exact destination `@buildwith_pankaj`

Any asset/content change requires a new approval ID.

## Current deployment requirement

The universal publisher requires these GitHub repository secrets:
- `PRIVATE_MEDIA_BASE_URL` (already present)
- `PRIVATE_MEDIA_TOKEN` (already present)
- `BUFFER_API_KEY` (must be added once if it is not already present)

The existing legacy Reel publishing path remains intact and can continue working through the Cloudflare Worker.

## Current third-party limitations

The code intentionally caps carousels at 10 assets because Buffer currently documents a 10-media maximum for Instagram carousels even though Instagram's native app may allow more. We design to the publishing API, not the native-app maximum.

Stories/reels/posts/carousels are supported by the package model. Instagram-native stickers, licensed music, and other app-only effects should use notification/manual completion when automatic APIs do not expose those controls.
