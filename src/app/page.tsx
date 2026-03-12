
"use client"

import React, { useState, useRef } from 'react';
import { Camera, Heart, Stethoscope, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CameraCapture } from '@/components/camera-capture';
import { LoadingState } from '@/components/loading-state';
import { MedicineResult } from '@/components/medicine-result';
import { explainMedicine } from '@/ai/flows/medicine-explanation';
import type { MedicineExplanationOutput } from '@/ai/flows/medicine-explanation';

type AppState = 'IDLE' | 'CAPTURING' | 'PROCESSING' | 'RESULT';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [result, setResult] = useState<MedicineExplanationOutput | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartCapture = () => setAppState('CAPTURING');
  
  const handlePhotoCaptured = async (photoDataUri: string) => {
    setAppState('PROCESSING');
    try {
      const output = await explainMedicine({ photoDataUri });
      setResult(output);
      setAppState('RESULT');
    } catch (error) {
      console.error("AI processing error:", error);
      alert("Houve um probleminha ao ler a foto. Tente novamente, vovó!");
      setAppState('IDLE');
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handlePhotoCaptured(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setResult(null);
    setAppState('IDLE');
  };

  return (
    <main className="max-w-md mx-auto min-h-screen flex flex-col p-6 font-body">
      {/* Header */}
      <header className="flex items-center justify-center space-x-3 py-8">
        <div className="bg-primary p-3 rounded-2xl shadow-md">
          <Heart className="w-8 h-8 text-white fill-white" />
        </div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">
          Vovó Remédio
        </h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center">
        {appState === 'IDLE' && (
          <div className="flex flex-col items-center justify-center space-y-8 text-center animate-in fade-in zoom-in duration-500 w-full">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-foreground leading-tight px-4">
                Olá! Vamos ver para que serve seu remédio?
              </h2>
              <p className="text-2xl text-muted-foreground font-medium">
                Escolha uma das opções abaixo:
              </p>
            </div>
            
            <div className="flex flex-col space-y-6 w-full px-4">
              <div className="relative group">
                <div className="absolute -inset-4 bg-primary/10 rounded-[3rem] blur-2xl group-hover:bg-primary/20 transition-all" />
                <Button
                  onClick={handleStartCapture}
                  className="relative w-full h-40 rounded-[2.5rem] flex flex-col items-center justify-center space-y-3 shadow-xl text-2xl font-bold bg-primary text-white hover:scale-[1.02] transition-transform active:scale-95"
                >
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <Camera className="w-10 h-10" />
                  </div>
                  <span>Tirar Foto Agora</span>
                </Button>
              </div>

              <div className="relative group">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  onClick={handleFileClick}
                  variant="secondary"
                  className="relative w-full h-32 rounded-[2.5rem] flex flex-col items-center justify-center space-y-2 shadow-lg text-xl font-bold hover:scale-[1.02] transition-transform active:scale-95"
                >
                  <div className="w-14 h-14 bg-white/40 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-primary" />
                  </div>
                  <span>Pegar da Galeria</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-primary font-bold pt-4">
              <Stethoscope className="w-6 h-6" />
              <span className="text-xl italic">Simples e fácil como a vovó gosta!</span>
            </div>
          </div>
        )}

        {appState === 'CAPTURING' && (
          <CameraCapture 
            onCapture={handlePhotoCaptured} 
            onCancel={() => setAppState('IDLE')} 
          />
        )}

        {appState === 'PROCESSING' && (
          <LoadingState />
        )}

        {appState === 'RESULT' && result && (
          <MedicineResult
            medicineName={result.medicineName}
            explanation={result.simpleExplanation}
            onReset={handleReset}
          />
        )}
      </div>

      {/* Accessibility hint at footer if IDLE */}
      {appState === 'IDLE' && (
        <footer className="py-6 text-center text-muted-foreground/60 text-lg">
          Vovó Remédio Fácil - 2024
        </footer>
      )}
    </main>
  );
}
