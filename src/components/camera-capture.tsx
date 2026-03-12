"use client"

import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraCaptureProps {
  onCapture: (dataUri: string) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Não conseguimos abrir a câmera. Por favor, verifique as permissões.");
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        onCapture(dataUri);
      }
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
        <p className="text-2xl text-destructive font-bold">{error}</p>
        <Button onClick={onCancel} size="lg" className="h-20 w-full text-2xl rounded-2xl">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      <div className="relative flex-1 overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <button
          onClick={onCancel}
          className="absolute top-6 left-6 p-4 bg-white/20 backdrop-blur-md rounded-full text-white"
        >
          <X className="w-10 h-10" />
        </button>
      </div>

      <div className="h-40 bg-background flex items-center justify-center px-6">
        <button
          onClick={capturePhoto}
          className="group relative flex items-center justify-center"
        >
          <div className="absolute w-24 h-24 bg-primary/20 rounded-full animate-ping" />
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-90 border-4 border-white">
            <Camera className="w-10 h-10 text-white" />
          </div>
        </button>
      </div>
    </div>
  );
}
