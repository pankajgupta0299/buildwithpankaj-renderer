import crypto from "node:crypto";
export function services(env = process.env) {
  const base = env.PRIVATE_MEDIA_BASE_URL,
    token = env.PRIVATE_MEDIA_TOKEN,
    bufferToken = env.BUFFER_API_KEY;
  if (!base || !token || !bufferToken || new URL(base).protocol !== "https:")
    throw Error("Missing publishing configuration");
  const media = async (key, method = "GET", body) => {
    const r = await fetch(base + "/media/" + encodeURIComponent(key), {
      method,
      headers: {
        Authorization: "Bearer " + token,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return r;
  };
  const storage = {
    read: async (key) => {
      const r = await media(key);
      if (r.status === 404) return null;
      if (!r.ok) throw Error("Private record read failed: HTTP " + r.status);
      return r.json();
    },
    write: async (key, value) => {
      const r = await media(key, "PUT", value);
      if (!r.ok) throw Error("Private record write failed: HTTP " + r.status);
    },
  };
  const buffer = async (query, variables = {}) => {
    const r = await fetch("https://api.buffer.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + bufferToken,
      },
      body: JSON.stringify({ query, variables }),
    });
    const b = await r.json();
    if (!r.ok || b.errors?.length)
      throw Error(
        "Buffer request failed; response withheld to protect media URLs",
      );
    return b.data;
  };
  const verifyAsset = async (a) => {
    const r = await media(a.key);
    if (!r.ok) throw Error("Private media unavailable");
    const h = crypto.createHash("sha256");
    for await (const chunk of r.body) h.update(chunk);
    if (h.digest("hex") !== a.sha256)
      throw Error("Approved media SHA-256 mismatch");
  };
  return { storage, media, buffer, verifyAsset };
}
export const postQuery =
  "query Post($id: PostId!) { post(input: {id: $id}) { id status externalLink sentAt } }";
