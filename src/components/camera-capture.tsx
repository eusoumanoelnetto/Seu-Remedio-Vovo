"use client"

import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraCaptureProps {
  onCapture: (dataUri: string) => void;
  onCancel: () => void;
  onFileSelect?: () => void;
}

export function CameraCapture({ onCapture, onCancel, onFileSelect }: CameraCaptureProps) {
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
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-10 text-center space-y-10 animate-fade-in">
        <div className="bg-error-container p-6 rounded-full shadow-inner">
          <X className="w-16 h-16 text-error" />
        </div>
        <div className="space-y-4 max-w-sm">
          <p className="text-3xl font-headline font-extrabold text-on-background leading-tight">{error}</p>
          <p className="text-xl text-muted-foreground">Tente usar um arquivo da sua galeria enquanto isso!</p>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Button onClick={onFileSelect} size="lg" className="h-20 w-full text-2xl rounded-[2rem] bg-primary text-white shadow-xl">
             Escolher da Galeria
          </Button>
          <Button onClick={onCancel} variant="outline" className="h-16 w-full text-xl rounded-[2rem] border-2 border-primary/20">
             Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-[100]">
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute top-0 inset-x-0 p-8 flex justify-between items-center z-10">
          <button
            onClick={onCancel}
            className="p-5 bg-black/50 backdrop-blur-md rounded-full text-white border border-white/20 active:scale-90 transition-transform"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="bg-white/95 backdrop-blur-md px-8 py-4 rounded-full shadow-2xl border border-white/50 flex items-center gap-3">
             <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
             <span className="text-xl font-headline font-extrabold text-primary">MedGrandma Vendo...</span>
          </div>
        </div>

        {/* Framing Guide */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[85%] aspect-square border-4 border-white/60 rounded-[3rem] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 border-8 border-dashed border-white/30 rounded-[3rem] animate-pulse" />
          </div>
        </div>
      </div>

      <div className="h-64 bg-background flex flex-col items-center justify-center px-8 border-t border-accent relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        <div className="flex items-center justify-between w-full max-w-sm">
          <button
            onClick={onFileSelect}
            className="flex flex-col items-center gap-2 group opacity-80 hover:opacity-100 transition-opacity"
          >
            <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center pillow-shadow text-primary">
              <ImageIcon className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-primary">Galeria</span>
          </button>

          <button
            onClick={capturePhoto}
            className="group relative flex items-center justify-center scale-125"
          >
            <div className="absolute w-28 h-28 bg-primary/10 rounded-full animate-ping duration-[3000ms]" />
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 border-8 border-white">
              <Camera className="w-10 h-10 text-white" />
            </div>
          </button>

          <div className="w-16 invisible" /> {/* Spacer */}
        </div>
        
        <p className="mt-8 text-primary font-headline font-extrabold text-2xl animate-pulse">Aperte aqui para ler!</p>
      </div>
    </div>
  );
}
