"use client";

import { useCallback, useRef, useState } from "react";

interface UploadParams {
  roomId: string;
  roomType: string;
  userName: string;
  sessionNum: number;
}

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const uploadParamsRef = useRef<UploadParams | null>(null);

  const startRecording = useCallback(
    (stream: MediaStream, params: UploadParams) => {
      chunksRef.current = [];
      startTimeRef.current = Date.now();
      uploadParamsRef.current = params;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm",
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
        const params = uploadParamsRef.current;

        if (params && blob.size > 0) {
          setIsUploading(true);
          try {
            const formData = new FormData();
            formData.append("file", blob, "recording.webm");
            formData.append("roomId", params.roomId);
            formData.append("roomType", params.roomType);
            formData.append("userName", params.userName);
            formData.append("durationSec", String(durationSec));
            formData.append("sessionNum", String(params.sessionNum));

            await fetch("/api/recordings", {
              method: "POST",
              body: formData,
            });
          } catch (err) {
            console.error("Failed to upload recording:", err);
          } finally {
            setIsUploading(false);
          }
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
    },
    []
  );

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  return { isRecording, isUploading, startRecording, stopRecording };
}
