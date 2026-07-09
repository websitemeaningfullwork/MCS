import { ImageResponse } from "next/og";

export const alt = "Meaningful Career Academy — Find the Right Mentor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0B1220 0%, #0F172A 60%, #0F766E 160%)",
          color: "#F8FAFC",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#0F766E",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: "#94A3B8" }}>
            Meaningful Career Academy
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            display: "flex",
            flexDirection: "column",
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          <div>Find the Right Mentor.</div>
          <div style={{ color: "#2DD4BF" }}>Build a Meaningful Career.</div>
        </div>

        <div style={{ marginTop: 32, fontSize: 28, color: "#94A3B8" }}>
          Premium mentorship-first learning · Bangladesh
        </div>
      </div>
    ),
    { ...size },
  );
}
