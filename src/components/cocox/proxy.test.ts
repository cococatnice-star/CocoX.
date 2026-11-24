import { describe, expect, it } from "vitest";

import {
  engineFor,
  fromProxyUrl,
  isYouTubeUrl,
  SCRAMJET_PREFIX,
  toProxyUrl,
  youTubePlayerUrl,
  youTubeVideoId,
} from "./proxy";

describe("proxy engine routing", () => {
  it("loads every site through Scramjet and decodes the address back", () => {
    const tiktok = "https://www.tiktok.com/@user/video/1234567890";
    const proxied = toProxyUrl(tiktok, "scramjet");

    expect(proxied.startsWith(SCRAMJET_PREFIX)).toBe(true);
    expect(fromProxyUrl(proxied)).toBe(tiktok);
  });

  it("sends YouTube video addresses to YouTube Player in ytplayer mode", () => {
    expect(engineFor("https://www.youtube.com/watch?v=mFmTQDQnAPk", "ytplayer")).toBe("player");
    expect(engineFor("https://youtu.be/mFmTQDQnAPk", "ytplayer")).toBe("player");
    expect(engineFor("https://www.youtube.com/", "ytplayer")).toBe("scramjet");
    expect(engineFor("https://www.tiktok.com/", "ytplayer")).toBe("scramjet");
  });

  it("sends everything through Scramjet in scramjet mode", () => {
    expect(engineFor("https://www.youtube.com/watch?v=mFmTQDQnAPk", "scramjet")).toBe("scramjet");
    expect(engineFor("https://www.tiktok.com/", "scramjet")).toBe("scramjet");
  });

  it("recognises YouTube addresses", () => {
    expect(isYouTubeUrl("https://www.youtube.com/watch?v=mFmTQDQnAPk")).toBe(true);
    expect(isYouTubeUrl("https://youtu.be/mFmTQDQnAPk")).toBe(true);
    expect(isYouTubeUrl("https://www.tiktok.com/")).toBe(false);
  });

  it("builds YouTube's own player address for a video", () => {
    expect(youTubePlayerUrl("https://www.youtube.com/watch?v=mFmTQDQnAPk&t=90s")).toBe(
      "https://www.youtube.com/embed/mFmTQDQnAPk?autoplay=1&rel=0&playsinline=1&start=90",
    );
    expect(youTubeVideoId("https://www.youtube.com/watch?v=mFmTQDQnAPk")).toBe("mFmTQDQnAPk");
    expect(youTubeVideoId("https://example.com/")).toBe(null);
  });
});
