// BuildWithPankaj Cloudflare Worker patch:
// Add this branch inside the EXISTING authenticated /media/:assetId route,
// after assetId validation and before GET/HEAD/PUT fall-through.
//
// Existing bindings assumed:
//   env.MEDIA            -> R2 bucket binding
//   env.MEDIA_AUTH_TOKEN -> bearer token already used by /media
//
// IMPORTANT: preserve all existing Worker routes and helpers.

if (request.method === "DELETE") {
  await env.MEDIA.delete(assetId);

  // Fail closed: verify deletion before reporting success.
  const remaining = await env.MEDIA.head(assetId);
  if (remaining) {
    return Response.json(
      { ok: false, error: "R2 delete verification failed", assetId },
      { status: 500 }
    );
  }

  return Response.json(
    { ok: true, deleted: true, assetId },
    { status: 200 }
  );
}
