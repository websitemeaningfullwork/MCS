import { describe, it, expect } from "vitest";
import { youtubeId, youtubeEmbedUrl, youtubeThumbnail } from "./youtube";

describe("youtubeId", () => {
  it("parses every common URL shape to the 11-char id", () => {
    const id = "dQw4w9WgXcQ";
    expect(youtubeId(`https://www.youtube.com/watch?v=${id}`)).toBe(id);
    expect(youtubeId(`https://www.youtube.com/watch?v=${id}&list=PLx`)).toBe(id);
    expect(youtubeId(`https://youtu.be/${id}`)).toBe(id);
    expect(youtubeId(`https://youtu.be/${id}?si=abc`)).toBe(id);
    expect(youtubeId(`https://www.youtube.com/embed/${id}`)).toBe(id);
    expect(youtubeId(`https://www.youtube.com/shorts/${id}`)).toBe(id);
    expect(youtubeId(`https://www.youtube.com/live/${id}`)).toBe(id);
    expect(youtubeId(`https://www.youtube.com/v/${id}`)).toBe(id);
    expect(youtubeId(`https://m.youtube.com/watch?v=${id}`)).toBe(id);
  });

  it("accepts a bare id and trims whitespace", () => {
    expect(youtubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("  https://youtu.be/dQw4w9WgXcQ  ")).toBe("dQw4w9WgXcQ");
  });

  it("returns null for empty or non-YouTube input", () => {
    expect(youtubeId(null)).toBeNull();
    expect(youtubeId("")).toBeNull();
    expect(youtubeId("https://example.com/video")).toBeNull();
  });
});

describe("youtubeEmbedUrl", () => {
  it("normalises to a nocookie embed", () => {
    expect(youtubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1",
    );
    expect(youtubeEmbedUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1",
    );
  });

  it("passes through an unrecognised embed url (e.g. a playlist series)", () => {
    const playlist = "https://www.youtube.com/embed/videoseries?list=PLxyz";
    expect(youtubeEmbedUrl(playlist)).toBe(playlist);
  });

  it("returns null when there is nothing to play", () => {
    expect(youtubeEmbedUrl(null)).toBeNull();
    expect(youtubeEmbedUrl("https://example.com/not-a-video")).toBeNull();
  });
});

describe("youtubeThumbnail", () => {
  it("builds an hqdefault thumbnail url", () => {
    expect(youtubeThumbnail("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    );
  });
  it("returns null for unrecognised input", () => {
    expect(youtubeThumbnail(null)).toBeNull();
  });
});
