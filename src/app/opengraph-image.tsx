import { ImageResponse } from "next/og";

export const alt = "词途 LexiTrail";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#f3f5ed",
          color: "#132019",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ position: "absolute", width: 520, height: 520, right: -80, top: -120, background: "#1746d1", borderRadius: "50%" }} />
        <div style={{ position: "absolute", width: 240, height: 240, right: 140, bottom: -80, background: "#d8ff3e", transform: "rotate(18deg)" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
          <div style={{ fontSize: 26, letterSpacing: 4, color: "#1746d1", fontWeight: 700 }}>LEXITRAIL</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 92, lineHeight: 0.95, fontWeight: 800, letterSpacing: -5 }}>Read the world.</div>
            <div style={{ marginTop: 18, fontSize: 48, lineHeight: 1, color: "#f0542d" }}>Remember the words.</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}