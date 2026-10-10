"use client";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  UploadSimple,
  Flower,
  Heart,
  Star,
} from "@phosphor-icons/react";
import { useWorld } from "./WorldContext";
export default function PhotoBooth() {
  const { data, booth, setBooth } = useWorld();
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    input = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const exportLock = useRef(false);
  const painting = useRef<Promise<void>>(Promise.resolve()),
    cameraLock = useRef(false),
    mounted = useRef(true);
  const Sticker =
    booth.sticker === "flower"
      ? Flower
      : booth.sticker === "star"
        ? Star
        : Heart;
  function stopCamera() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setCamera(false);
  }
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);
  useEffect(() => {
    if (camera && video.current && stream.current) {
      video.current.srcObject = stream.current;
      void video.current
        .play()
        .catch(() => setMessage("Your camera preview could not start."));
    }
  }, [camera]);
  useEffect(() => {
    let cancelled = false;
    async function paint() {
      const output = canvas.current;
      if (!output) return;
      const strip = booth.frame === "strip";
      output.width = strip ? 600 : 900;
      output.height = strip ? 1900 : 1050;
      const ctx = output.getContext("2d")!;
      ctx.fillStyle = booth.frame === "pink" ? "#f5dcd3" : "#fff8e9";
      ctx.fillRect(0, 0, output.width, output.height);
      const slots = strip ? 4 : 1;
      for (let i = 0; i < slots; i++) {
        const source = booth.images[i] || booth.images[0];
        const x = strip ? 35 : 55,
          y = strip ? 35 + i * 420 : 55,
          w = strip ? 530 : 790,
          h = strip ? 385 : 790;
        ctx.fillStyle = "#e3dbd0";
        ctx.fillRect(x, y, w, h);
        if (source) {
          const image = new Image();
          image.src = source;
          await image.decode();
          if (cancelled) return;
          const naturalRatio = image.naturalWidth / image.naturalHeight,
            targetRatio = w / h;
          let sw = image.naturalWidth,
            sh = image.naturalHeight;
          if (naturalRatio > targetRatio) sw = sh * targetRatio;
          else sh = sw / targetRatio;
          sw /= booth.zoom;
          sh /= booth.zoom;
          ctx.drawImage(
            image,
            ((image.naturalWidth - sw) * booth.x) / 100,
            ((image.naturalHeight - sh) * booth.y) / 100,
            sw,
            sh,
            x,
            y,
            w,
            h,
          );
        }
      }
      ctx.fillStyle = "#765a55";
      ctx.font = `${strip ? 24 : 33}px Georgia, serif`;
      ctx.textAlign = "center";
      const words = booth.caption.split(/\s+/),
        lines: string[] = [];
      let line = "";
      for (const word of words) {
        if (ctx.measureText(`${line} ${word}`).width > output.width - 90) {
          if (line) lines.push(line);
          line = word;
        } else line += (line ? " " : "") + word;
      }
      if (line) lines.push(line);
      lines
        .slice(0, 4)
        .forEach((value, i) =>
          ctx.fillText(
            value,
            output.width / 2,
            (strip ? 1760 : 905) + i * (strip ? 27 : 34),
            output.width - 90,
          ),
        );
      if (booth.date) {
        ctx.font = "18px Georgia,serif";
        ctx.fillText(data.today, output.width / 2, output.height - 28);
      }
      if (booth.sticker) {
        ctx.save();
        ctx.translate(output.width - 95, strip ? 1735 : 860);
        ctx.fillStyle = "#b8757b";
        ctx.strokeStyle = "#b8757b";
        if (booth.sticker === "heart") {
          ctx.beginPath();
          ctx.moveTo(0, 12);
          ctx.bezierCurveTo(-45, -15, -20, -40, 0, -20);
          ctx.bezierCurveTo(20, -40, 45, -15, 0, 12);
          ctx.fill();
        } else if (booth.sticker === "flower") {
          for (let i = 0; i < 8; i++) {
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.ellipse(0, -19, 8, 17, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = "#d8b75e";
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const radius = i % 2 ? 12 : 25,
              angle = (i * Math.PI) / 5 - Math.PI / 2;
            ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
    }
    painting.current = paint();
    void painting.current.catch(() =>
      setMessage("This picture could not be drawn. Try another photograph."),
    );
    return () => {
      cancelled = true;
    };
  }, [booth, data.today]);
  async function startCamera() {
    if (cameraLock.current || stream.current) return;
    setMessage("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(
        "Camera capture needs HTTPS or a local browser. You can upload a photograph instead.",
      );
      return;
    }
    cameraLock.current = true;
    try {
      const activeStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1200 } },
        audio: false,
      });
      if (!mounted.current) {
        activeStream.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = activeStream;
      setCamera(true);
    } catch {
      setMessage(
        "Camera access was not available. You can still upload a photograph.",
      );
    } finally {
      cameraLock.current = false;
    }
  }
  function captured(source: string) {
    setBooth((previous) => ({
      ...previous,
      images:
        previous.frame === "strip"
          ? [...previous.images.slice(-3), source]
          : [source],
    }));
    setMessage("Your photo is on this device only. It has not been uploaded.");
  }
  function capture() {
    const source = video.current;
    if (!source || !source.videoWidth) return;
    const snapshot = document.createElement("canvas");
    snapshot.width = source.videoWidth;
    snapshot.height = source.videoHeight;
    snapshot.getContext("2d")!.drawImage(source, 0, 0);
    captured(snapshot.toDataURL("image/jpeg", 0.92));
    if (booth.frame !== "strip") stopCamera();
  }
  async function upload(file: File) {
    if (
      file.size > 20 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      setMessage("Choose a JPG, PNG, or WebP smaller than 20 MB.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width * bitmap.height > 40000000) {
        bitmap.close();
        throw new Error();
      }
      const image = document.createElement("canvas"),
        scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
      image.width = Math.round(bitmap.width * scale);
      image.height = Math.round(bitmap.height * scale);
      image
        .getContext("2d")!
        .drawImage(bitmap, 0, 0, image.width, image.height);
      bitmap.close();
      captured(image.toDataURL("image/jpeg", 0.92));
    } catch {
      setMessage("This picture could not be opened. Try another photograph.");
    }
  }
  async function png() {
    await painting.current;
    const current = canvas.current;
    if (!current) throw new Error("The photo is not ready.");
    return new Promise<Blob>((resolve, reject) =>
      current.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("PNG export failed.")),
        "image/png",
      ),
    );
  }
  async function save(shared = false) {
    if (exportLock.current || !booth.images.length) return;
    exportLock.current = true;
    setBusy(true);
    try {
      const blob = await png();
      if (shared) {
        const form = new FormData();
        form.set(
          "file",
          new File([blob], "our-photo-booth.png", { type: "image/png" }),
        );
        form.set("purpose", "booth");
        form.set("caption", booth.caption);
        const response = await fetch("/api/world/upload", {
          method: "POST",
          body: form,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        setMessage(
          "Saved privately to your keepsake drawer. It has not been published in the gallery.",
        );
      } else {
        const url = URL.createObjectURL(blob),
          link = document.createElement("a");
        link.href = url;
        link.download = "our-little-photo-booth.png";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        setMessage("Your PNG is ready. The download has started.");
      }
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
      exportLock.current = false;
    }
  }
  return (
    <div className="photo-booth">
      <div className="booth-preview">
        {camera && (
          <div className="camera-view">
            <video
              ref={video}
              playsInline
              muted
              aria-label="Live camera preview"
            />
            <button className="button primary" onClick={capture}>
              Capture a photograph
            </button>
            <button className="text-button" onClick={stopCamera}>
              Close camera
            </button>
          </div>
        )}
        <canvas
          ref={canvas}
          className="booth-canvas"
          role="img"
          aria-label={`Photo booth ${booth.frame} frame with ${booth.images.length} locally selected pictures and caption ${booth.caption}`}
        />
      </div>
      <div className="booth-tools">
        <h2>A little picture to keep.</h2>
        <p>
          Your camera and pictures stay on this device. Uploading to the private
          drawer requires a separate Save action.
        </p>
        <div className="world-actions">
          <button
            className="button secondary"
            onClick={() => void startCamera()}
            disabled={camera}
          >
            <Camera size={21} /> Take a photo
          </button>
          <button
            className="button secondary"
            onClick={() => input.current?.click()}
          >
            <UploadSimple size={21} /> Upload a photo
          </button>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Upload photo booth photograph"
            onChange={(event) => {
              if (event.target.files?.[0]) void upload(event.target.files[0]);
              event.target.value = "";
            }}
          />
        </div>
        <label>
          Your frame
          <select
            aria-label="Photo frame"
            value={booth.frame}
            onChange={(event) =>
              setBooth({
                ...booth,
                frame: event.target.value as typeof booth.frame,
              })
            }
          >
            <option value="cream">Cream Polaroid</option>
            <option value="pink">Pink Polaroid</option>
            <option value="strip">Four-picture strip</option>
          </select>
        </label>
        {booth.frame === "strip" && (
          <p>
            Add up to four photos. Unfilled frames repeat the first picture.
          </p>
        )}
        <label>
          Handwritten caption
          <textarea
            aria-label="Photo caption"
            maxLength={120}
            value={booth.caption}
            onChange={(event) =>
              setBooth({ ...booth, caption: event.target.value })
            }
          />
        </label>
        <div className="booth-stickers" aria-label="Choose a sticker">
          {data.settings.stickers.map((sticker) => (
            <button
              className="icon-button"
              key={sticker}
              aria-label={`${sticker} sticker`}
              aria-pressed={booth.sticker === sticker}
              onClick={() =>
                setBooth({
                  ...booth,
                  sticker: booth.sticker === sticker ? "" : sticker,
                })
              }
            >
              {sticker === "flower" ? (
                <Flower size={25} />
              ) : sticker === "star" ? (
                <Star size={25} />
              ) : (
                <Heart size={25} />
              )}
            </button>
          ))}
          <Sticker size={20} aria-hidden="true" />
        </div>
        <label className="world-check">
          <input
            type="checkbox"
            checked={booth.date}
            onChange={(event) =>
              setBooth({ ...booth, date: event.target.checked })
            }
          />{" "}
          Add today&apos;s date
        </label>
        {(["x", "y", "zoom"] as const).map((key) => (
          <label key={key}>
            {key === "zoom"
              ? "Crop zoom"
              : key === "x"
                ? "Horizontal position"
                : "Vertical position"}
            <input
              type="range"
              aria-label={
                key === "zoom"
                  ? "Crop zoom"
                  : key === "x"
                    ? "Horizontal position"
                    : "Vertical position"
              }
              min={key === "zoom" ? 1 : 0}
              max={key === "zoom" ? 3 : 100}
              step={key === "zoom" ? 0.05 : 1}
              value={booth[key]}
              onChange={(event) =>
                setBooth({ ...booth, [key]: Number(event.target.value) })
              }
            />
          </label>
        ))}
        <div className="world-actions">
          <button
            className="button primary"
            disabled={!booth.images.length || busy}
            onClick={() => void save()}
          >
            Download PNG
          </button>
          {data.actor &&
            (data.settings.boothSharing || data.actor.role === "owner") && (
              <button
                className="button secondary"
                disabled={!booth.images.length || busy}
                onClick={() => void save(true)}
              >
                Save privately to my drawer
              </button>
            )}
          <button
            className="text-button"
            onClick={() => {
              stopCamera();
              setBooth({
                ...booth,
                images: [],
                caption: "",
                x: 50,
                y: 50,
                zoom: 1,
              });
              setMessage("Your temporary pictures have been discarded.");
            }}
          >
            Discard & create another
          </button>
          <button
            className="text-button"
            onClick={() =>
              setBooth({
                ...booth,
                x: 50,
                y: 50,
                zoom: 1,
                sticker: "",
                caption: "",
                date: false,
              })
            }
          >
            Reset decorations
          </button>
        </div>
        <p role="status">{message}</p>
      </div>
    </div>
  );
}
