import { ImageResponse } from "next/og";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: "#fbe9e1",
        color: "#ad6368",
        fontSize: 29,
        fontStyle: "italic",
        borderRadius: 8,
      }}
    >
      f
    </div>,
    { ...size },
  );
}
