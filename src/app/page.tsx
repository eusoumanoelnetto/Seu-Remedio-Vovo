"use client"

import React, { useState } from 'react';
import { Camera, Heart, Stethoscope } from 'lucide-react';
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
          <div className="flex flex-col items-center justify-center space-y-10 text-center animate-in fade-in zoom-in duration-500">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-foreground leading-tight px-4">
                Olá! Vamos ver para que serve seu remédio?
              </h2>
              <p className="text-2xl text-muted-foreground font-medium">
                É só apertar o botão azul grande abaixo e tirar uma foto da caixinha!
              </p>
            </div>
            
            <div className="relative group w-full px-4">
              <div className="absolute -inset-4 bg-primary/10 rounded-[3rem] blur-2xl group-hover:bg-primary/20 transition-all" />
              <Button
                onClick={handleStartCapture}
                className="relative w-full h-48 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 shadow-xl text-3xl font-bold bg-primary text-white hover:scale-[1.02] transition-transform active:scale-95"
              >
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <Camera className="w-12 h-12" />
                </div>
                <span>Tirar Foto do Remédio</span>
              </Button>
            </div>

            <div className="flex items-center space-x-2 text-primary font-bold pt-8">
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
