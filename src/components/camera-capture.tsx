"use client"

import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';
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
        setError("Não conseguimos abrir a câmera. Por favor, verifique se a senhora autorizou o uso da câmera no celular.");
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
      <div className="flex flex-col items-center justify-center p-10 text-center space-y-8 animate-fade-in card-elegant m-4">
        <div className="bg-destructive/10 p-4 rounded-full">
          <X className="w-12 h-12 text-destructive" />
        </div>
        <p className="text-2xl text-foreground font-bold">{error}</p>
        <Button onClick={onCancel} size="lg" className="h-20 w-full text-2xl rounded-[2rem] bg-primary text-white shadow-lg">
          Tentar Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center pointer-events-none">
          <button
            onClick={onCancel}
            className="pointer-events-auto p-4 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/20 active:scale-90 transition-transform"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-white/50">
             <span className="text-lg font-bold text-foreground">Enquadre bem a foto</span>
          </div>
        </div>

        {/* Guia visual para vovó */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-72 h-72 border-2 border-white/40 rounded-[3rem] shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]">
            <div className="absolute inset-0 border-4 border-dashed border-white/20 rounded-[3rem] animate-pulse" />
          </div>
        </div>
      </div>

      <div className="h-44 bg-background flex flex-col items-center justify-center px-6 border-t border-accent relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        <button
          onClick={capturePhoto}
          className="group relative flex items-center justify-center"
        >
          <div className="absolute w-28 h-28 bg-primary/10 rounded-full animate-ping duration-[3000ms]" />
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 border-8 border-white group-hover:shadow-primary/20">
            <Camera className="w-10 h-10 text-white" />
          </div>
        </button>
        <p className="mt-4 text-primary font-bold text-lg">Aperte aqui para tirar a foto</p>
      </div>
    </div>
  );
}