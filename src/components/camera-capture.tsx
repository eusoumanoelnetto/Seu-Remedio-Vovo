"use client"

import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        // Tenta primeiro a câmera traseira (environment)
        let mediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false,
          });
        } catch (innerErr: any) {
          // Se falhar (ex: no PC que só tem webcam frontal), tenta qualquer câmera disponível
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
        
        setStream(mediaStream);
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setHasCameraPermission(false);
        let message = "Não conseguimos abrir a câmera, vovó.";
        
        if (err.name === 'NotFoundError') {
          message = "Ih, vovó! Não encontrei nenhuma câmera ligada no seu aparelho.";
        } else if (err.name === 'NotAllowedError') {
          message = "Vovó, a senhora precisa clicar em 'Permitir' para eu conseguir ver o remédio!";
        } else {
          message = "Tivemos um probleminha técnico com a câmera. Vamos tentar de novo?";
        }
        
        setError(message);
        toast({
          variant: 'destructive',
          title: 'Acesso à Câmera',
          description: message,
        });
      }
    };

    getCameraPermission();

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

  if (error || hasCameraPermission === false) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-10 text-center space-y-10 animate-fade-in z-[110]">
        <div className="w-32 h-32 rounded-full bg-error/10 border-[4px] border-error flex items-center justify-center shadow-xl animate-bounce">
          <AlertCircle className="w-16 h-16 text-error" />
        </div>
        <div className="space-y-4 max-w-sm">
          <p className="text-3xl font-headline font-extrabold text-on-background leading-tight">
            {error || "Vovó, preciso que a senhora autorize a câmera!"}
          </p>
          <div className="bg-surface-container-low p-6 rounded-[2rem] border-[3px] border-[#1e1b13] shadow-[6px_6px_0px_#1e1b13] italic">
            <p className="text-xl text-on-surface font-medium">
              "Não se preocupe! A senhora pode escolher uma foto que já tirou na sua galeria."
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Button 
            onClick={onFileSelect} 
            className="h-20 w-full text-2xl rounded-2xl bg-primary text-white border-[3px] border-[#1e1b13] shadow-[8px_8px_0px_#1e1b13] active:translate-y-1 active:shadow-none font-extrabold"
          >
             Escolher da Galeria
          </Button>
          <Button 
            onClick={onCancel} 
            variant="outline" 
            className="h-16 w-full text-xl rounded-full border-[3px] border-[#1e1b13] font-bold"
          >
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
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute top-0 inset-x-0 p-8 flex justify-between items-center z-10">
          <button
            onClick={onCancel}
            className="p-5 bg-black/50 backdrop-blur-md rounded-full text-white border-2 border-white/20 active:scale-90 transition-transform"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="bg-white/95 backdrop-blur-md px-8 py-4 rounded-full shadow-2xl border-[3px] border-[#1e1b13] flex items-center gap-3">
             <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
             <span className="text-xl font-headline font-extrabold text-primary">Olhando com amor...</span>
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[85%] aspect-square border-[6px] border-white/60 rounded-[3.5rem] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 border-8 border-dashed border-white/30 rounded-[3.5rem] animate-pulse" />
          </div>
        </div>
      </div>

      <div className="h-64 bg-background flex flex-col items-center justify-center px-8 border-t-[4px] border-[#1e1b13] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-primary/10" />
        
        <div className="flex items-center justify-between w-full max-w-sm">
          <button
            onClick={onFileSelect}
            className="flex flex-col items-center gap-2 group transition-all active:scale-90"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-[3px] border-[#1e1b13] shadow-[4px_4px_0px_#1e1b13] text-primary">
              <ImageIcon className="w-8 h-8" />
            </div>
            <span className="text-sm font-extrabold text-primary uppercase">Galeria</span>
          </button>

          <button
            onClick={capturePhoto}
            className="group relative flex items-center justify-center scale-125"
          >
            <div className="absolute w-28 h-28 bg-primary/10 rounded-full animate-ping duration-[3000ms]" />
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-[10px_10px_0px_#1e1b13] transition-all active:scale-90 active:shadow-none border-[6px] border-white">
              <Camera className="w-10 h-10 text-white" />
            </div>
          </button>

          <div className="w-16" />
        </div>
        
        <p className="mt-8 text-primary font-headline font-extrabold text-2xl animate-pulse tracking-tight uppercase">Aperte aqui para ler!</p>
      </div>
    </div>
  );
}
