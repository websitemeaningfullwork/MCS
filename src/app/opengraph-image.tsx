import { ImageResponse } from "next/og";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

export const alt = "Meaningful Career Academy — Find the Right Mentor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Node.js runtime: read the official logo from the project root and inline it
// as a base64 data URI (satori can't fetch/decode a bare webp).
export default async function OpengraphImage() {
  const logoData = await readFile(
    join(process.cwd(), "public/brand/mca-logo.png"),
    "base64",
  );
  const logoSrc = `data:image/png;base64,${logoData}`;

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
          background:
            "linear-gradient(135deg, #0B1220 0%, #101B33 55%, #12306E 145%)",
          color: "#F8FAFC",
          fontFamily: "sans-serif",
        }}
      >
        {/* Official logo on a white plate (the mark's text is navy). */}
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: "18px 26px",
            borderRadius: 20,
            background: "#ffffff",
            boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
          }}
        >
          <img
            src={logoSrc}
            width={192}
            height={72}
            alt="Meaningful Career Academy"
          />
        </div>

        <div
          style={{
            marginTop: 48,
            display: "flex",
            flexDirection: "column",
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          <div>Find the Right Mentor.</div>
          <div style={{ color: "#60A5FA" }}>Build a Meaningful Career.</div>
        </div>

        <div style={{ marginTop: 32, fontSize: 28, color: "#94A3B8" }}>
          Premium mentorship-first learning · Bangladesh
        </div>
      </div>
    ),
    { ...size },
  );
}
