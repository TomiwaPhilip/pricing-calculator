import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#1e211d",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#faf7ef",
            display: "flex",
            height: 42,
            left: 14,
            position: "absolute",
            top: 11,
            width: 8,
          }}
        />
        <div
          style={{
            background: "#faf7ef",
            display: "flex",
            height: 8,
            left: 14,
            position: "absolute",
            top: 11,
            width: 31,
          }}
        />
        <div
          style={{
            background: "#faf7ef",
            display: "flex",
            height: 7,
            left: 14,
            position: "absolute",
            top: 28,
            width: 24,
          }}
        />
        <div
          style={{
            background: "#b43c24",
            borderRadius: 999,
            bottom: 11,
            display: "flex",
            height: 11,
            position: "absolute",
            right: 10,
            width: 11,
          }}
        />
      </div>
    ),
    size,
  );
}
