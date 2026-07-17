"use client";

import { useCallback, useRef, useState } from "react";

const MOBILE_KEYWORDS = [
  "Mobile",
  "Phone",
  "Android",
  "Windows Mobile Camera",
  "DroidCam",
  "Iriun",
  "Continuity",
] as const;

const LS_KEY = "preferred_camera_id";

export interface CameraDevice {
  deviceId: string;
  label: string;
}

function isMobileCamera(label: string): boolean {
  const lower = label.toLowerCase();
  return MOBILE_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

export interface UseCameraResult {
  cameras: CameraDevice[];
  selectedDeviceId: string | null;
  hasMobileCamera: boolean;
  permissionDenied: boolean;
  enumerating: boolean;
  enumerate: () => Promise<void>;
  selectCamera: (deviceId: string) => void;
}

export function useCamera(): UseCameraResult {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [hasMobileCamera, setHasMobileCamera] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [enumerating, setEnumerating] = useState(false);
  const enumeratingRef = useRef(false);

  const enumerate = useCallback(async () => {
    if (enumeratingRef.current) return;
    enumeratingRef.current = true;
    setEnumerating(true);
    setPermissionDenied(false);

    try {
      let devices = await navigator.mediaDevices.enumerateDevices();
      let videoInputs = devices.filter((d) => d.kind === "videoinput");
      const hasLabels = videoInputs.some((d) => d.label);

      if (!hasLabels) {
        let tempStream: MediaStream | null = null;
        try {
          tempStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
        } catch {
          setPermissionDenied(true);
          setEnumerating(false);
          enumeratingRef.current = false;
          return;
        }

        if (tempStream) {
          tempStream.getTracks().forEach((t) => t.stop());
        }

        devices = await navigator.mediaDevices.enumerateDevices();
        videoInputs = devices.filter((d) => d.kind === "videoinput");
      }

      const mapped: CameraDevice[] = videoInputs.map((d) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
      }));

      setCameras(mapped);

      const mobile = mapped.find((d) => isMobileCamera(d.label));
      setHasMobileCamera(!!mobile);

      if (mobile) {
        setSelectedDeviceId(mobile.deviceId);
        localStorage.removeItem(LS_KEY);
      } else {
        const saved = localStorage.getItem(LS_KEY);
        if (saved && mapped.some((d) => d.deviceId === saved)) {
          setSelectedDeviceId(saved);
        } else if (mapped.length > 0) {
          setSelectedDeviceId(mapped[0].deviceId);
        }
      }
    } catch (err) {
      console.error("Camera enumeration failed:", err);
    } finally {
      setEnumerating(false);
      enumeratingRef.current = false;
    }
  }, []);

  const selectCamera = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
    localStorage.setItem(LS_KEY, deviceId);
  }, []);

  return {
    cameras,
    selectedDeviceId,
    hasMobileCamera,
    permissionDenied,
    enumerating,
    enumerate,
    selectCamera,
  };
}
