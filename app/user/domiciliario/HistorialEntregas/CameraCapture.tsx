"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface CameraProps {
  onPhotoCapture: (photoBase64: string) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onPhotoCapture, onCancel }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Error al acceder a la cámara:", error);
      alert("No se pudo acceder a la cámara. Por favor verifica los permisos.");
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        const photoData = canvasRef.current.toDataURL("image/jpeg", 0.85);
        setPhoto(photoData);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setIsCameraActive(false);
    }
  };

  const confirmPhoto = () => {
    if (photo) {
      onPhotoCapture(photo);
      stopCamera();
      setPhoto(null);
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Capturar Foto de Evidencia</h2>

        {!isCameraActive && !photo && (
          <div className="flex flex-col gap-3">
            <button
              onClick={startCamera}
              className="rounded-lg bg-sky-500 px-4 py-3 font-medium text-white hover:bg-sky-600"
            >
              Abrir Cámara
            </button>
            <button
              onClick={onCancel}
              className="rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        )}

        {isCameraActive && !photo && (
          <div className="flex flex-col gap-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="aspect-video rounded-lg bg-black object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2">
              <button
                onClick={takePhoto}
                className="flex-1 rounded-lg bg-emerald-500 px-4 py-3 font-medium text-white hover:bg-emerald-600"
              >
                Tomar Foto
              </button>
              <button
                onClick={() => {
                  stopCamera();
                  onCancel();
                }}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {photo && (
          <div className="flex flex-col gap-3">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-100">
              <Image
                src={photo}
                alt="Foto capturada"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={confirmPhoto}
                className="flex-1 rounded-lg bg-emerald-500 px-4 py-3 font-medium text-white hover:bg-emerald-600"
              >
                Confirmar
              </button>
              <button
                onClick={retakePhoto}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
              >
                Retomar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}