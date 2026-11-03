// Only imported by isolated test child processes. No real network calls.
import fs from "node:fs";
const statePath = process.env.TEST_STATE;
const state = () =>
  fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath))
    : { records: {}, creates: 0, deletes: 0 };
const save = (s) => fs.writeFileSync(statePath, JSON.stringify(s));
globalThis.fetch = async (url, options = {}) => {
  const s = state(),
    u = new URL(url),
    method = options.method || "GET";
  if (u.hostname === "api.buffer.com") {
    const body = JSON.parse(options.body);
    if (body.query.includes("query Channels"))
      return Response.json({
        data: {
          channels: [
            {
              id: "locked",
              name: "couplesconnectindia",
              service: "instagram",
              isDisconnected: false,
              isLocked: false,
            },
          ],
        },
      });
    if (body.query.includes("mutation CreatePost")) {
      s.creates++;
      save(s);
      if (process.env.LOSE_RESPONSE === "1") throw Error("response lost");
      return Response.json({
        data: { createPost: { post: { id: "post1", status: "sending" } } },
      });
    }
    return Response.json({
      data: {
        post: {
          id: "post1",
          status: process.env.POST_STATUS || "sent",
          externalLink: "https://www.instagram.com/reel/example/",
        },
      },
    });
  }
  if (u.hostname !== "media.test") throw Error("Unexpected network host");
  const key = decodeURIComponent(u.pathname.slice("/media/".length));
  if (key === "config-buffer-channel.json")
    return Response.json({ channelId: "locked", organizationId: "org" });
  if (key.startsWith("cc-publish-")) {
    if (method === "PUT") {
      s.records[key] = JSON.parse(options.body);
      save(s);
      return new Response("ok");
    }
    return s.records[key]
      ? Response.json(s.records[key])
      : new Response("", { status: 404 });
  }
  if (method === "DELETE") {
    s.deletes++;
    s.deleted = true;
    save(s);
    return new Response("ok");
  }
  if (s.deleted) return new Response("", { status: 404 });
  return new Response("video");
};
const originalTimeout = globalThis.setTimeout;
globalThis.setTimeout = (f, ms, ...args) =>
  originalTimeout(f, ms === 15000 ? 0 : ms, ...args);
