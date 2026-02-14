import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Encyclopedia Galactica — AI Interactive Exoplanet Terraforming Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0a1a 100%)",
        position: "relative",
      }}
    >
      {/* Stars */}
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: i % 3 === 0 ? "3px" : "2px",
            height: i % 3 === 0 ? "3px" : "2px",
            borderRadius: "50%",
            background: `rgba(255,255,255,${0.2 + (i % 5) * 0.15})`,
            top: `${(i * 37) % 100}%`,
            left: `${(i * 53) % 100}%`,
          }}
        />
      ))}

      {/* Planet circle */}
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.3)",
          background:
            "radial-gradient(circle at 40% 35%, #1a3a5c 0%, #0a1628 60%, #050d18 100%)",
          marginBottom: 32,
          display: "flex",
          boxShadow:
            "0 0 60px rgba(56,189,248,0.15), inset 0 0 30px rgba(0,0,0,0.5)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: "white",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Encyclopedia Galactica
        </div>
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.5)",
            marginTop: 16,
            letterSpacing: "0.05em",
          }}
        >
          Explore 5,000+ exoplanets · Terraform new worlds
        </div>
      </div>
    </div>,
    { ...size },
  );
}
