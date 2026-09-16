import jsQR from "jsqr";
import { cn } from "@/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { HiOutlineVideoCamera } from "react-icons/hi2";

import Alert from "./Alert";
import Button from "./Button";
import Select from "./Select";

/** Decode an ImageData with jsQR, tolerating both inversion modes */
function decodeImageData(imageData) {
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });

  return result?.data || null;
}

/** Decode a QR code out of an image file, or null when it holds none */
export async function decodeImageFile(file) {
  const bitmap = await createImageBitmap(file);

  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(bitmap, 0, 0);

    return decodeImageData(
      context.getImageData(0, 0, canvas.width, canvas.height),
    );
  } finally {
    bitmap.close();
  }
}

/** Live QR scanner, reporting failures so the page can fall back to paste or upload */
export default function QrScanner({ onResult, className }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const onResultRef = useRef(onResult);

  const [cameraRequested, setCameraRequested] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");

  /** Keep the latest callback without restarting the camera */
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  /** Release the camera and cancel the scan loop */
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  }, [setCameraActive]);

  /** Read one video frame, looping until a QR code turns up */
  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const text = decodeImageData(
      context.getImageData(0, 0, canvas.width, canvas.height),
    );

    if (text) {
      setCameraRequested(false);
      onResultRef.current?.(text);
      return;
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [setCameraRequested]);

  /** Open the camera and begin scanning */
  const startCamera = useCallback(async () => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: "environment" },
      });

      streamRef.current = stream;
      setCameraActive(true);

      /** List the cameras, which is only permitted once access is granted */
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(mediaDevices.filter((device) => device.kind === "videoinput"));

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (error) {
      console.error("Failed to start the camera:", error);
      stopCamera();
      setCameraRequested(false);
      setError(
        error?.name === "NotAllowedError"
          ? "Camera access was denied. Paste the login link or upload a screenshot instead."
          : "No camera is available. Paste the login link or upload a screenshot instead.",
      );
    }
  }, [deviceId, scanFrame, stopCamera, setCameraActive, setError, setDevices]);

  /** Run the camera while it is wanted, restarting when the device changes */
  useEffect(() => {
    if (!cameraRequested) return;

    startCamera();
    return stopCamera;
  }, [cameraRequested, deviceId]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-xl",
          "bg-neutral-100 dark:bg-neutral-900",
          cameraActive || "hidden",
        )}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          className="size-full object-cover"
        />
        <div
          className={cn(
            "absolute inset-8 rounded-xl pointer-events-none",
            "border-2 border-blue-500",
          )}
        />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {error ? <Alert variant="warning">{error}</Alert> : null}

      {cameraActive && devices.length > 1 ? (
        <Select
          value={deviceId}
          onChange={(event) => setDeviceId(event.target.value)}
        >
          {devices.map((device, index) => (
            <Select.Item key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${index + 1}`}
            </Select.Item>
          ))}
        </Select>
      ) : null}

      <Button
        variant={cameraRequested ? "secondary" : "default"}
        onClick={() => setCameraRequested((prev) => !prev)}
      >
        <HiOutlineVideoCamera className="size-5 shrink-0" />
        {cameraRequested ? "Stop Camera" : "Scan with Camera"}
      </Button>
    </div>
  );
}
