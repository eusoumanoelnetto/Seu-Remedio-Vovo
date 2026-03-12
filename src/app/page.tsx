
"use client"

import React, { useState, useRef } from 'react';
import { Camera, Heart, Stethoscope, Image as ImageIcon, FileText, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CameraCapture } from '@/components/camera-capture';
import { LoadingState } from '@/components/loading-state';
import { MedicineResult } from '@/components/medicine-result';
import { PrescriptionResult } from '@/components/prescription-result';
import { explainMedicine } from '@/ai/flows/medicine-explanation';
import { readPrescription } from '@/ai/flows/read-prescription-flow';
import type { MedicineExplanationOutput } from '@/ai/flows/medicine-explanation';
import type { ReadPrescriptionOutput } from '@/ai/flows/read-prescription-flow';
import { useToast } from '@/hooks/use-toast';

type AppMode = 'MEDICINE' | 'PRESCRIPTION';
type AppState = 'IDLE' | 'CAPTURING' | 'PROCESSING' | 'RESULT';

export default function Home() {
  const [appMode, setAppMode] = useState<AppMode>('MEDICINE');
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [medicineResult, setMedicineResult] = useState<MedicineExplanationOutput | null>(null);
  const [prescriptionResult, setPrescriptionResult] = useState<ReadPrescriptionOutput | null>(null);
  const [locationStatus, setLocationStatus] = useState<'IDLE' | 'GETTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getUserLocation = (): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(undefined);
        return;
      }

      setLocationStatus('GETTING');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = `Lat: ${position.coords.latitude}, Long: ${position.coords.longitude}`;
          setLocationStatus('SUCCESS');
          resolve(loc);
        },
        (error) => {
          console.error("Erro ao pegar localização:", error);
          setLocationStatus('ERROR');
          resolve(undefined);
        },
        { timeout: 10000 }
      );
    });
  };

  const handleStartCapture = (mode: AppMode) => {
    setAppMode(mode);
    setAppState('CAPTURING');
  };
  
  const handlePhotoCaptured = async (photoDataUri: string) => {
    setAppState('PROCESSING');
    try {
      if (appMode === 'MEDICINE') {
        const output = await explainMedicine({ photoDataUri });
        setMedicineResult(output);
      } else {
        // Para receitas, tentamos pegar a localização antes de chamar a IA
        const userLocation = await getUserLocation();
        const output = await readPrescription({ 
          photoDataUri,
          userLocation 
        });
        setPrescriptionResult(output);
      }
      setAppState('RESULT');
    } catch (error) {
      console.error("AI processing error:", error);
      toast({
        variant: "destructive",
        title: "Ih, vovó!",
        description: "Houve um probleminha ao ler a foto. Tente novamente!",
      });
      setAppState('IDLE');
    }
  };

  const handleFileClick = (mode: AppMode) => {
    setAppMode(mode);
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
    setMedicineResult(null);
    setPrescriptionResult(null);
    setAppState('IDLE');
    setLocationStatus('IDLE');
  };

  return (
    <main className="max-w-md mx-auto min-h-screen flex flex-col p-6 font-body">
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
          <div className="flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in zoom-in duration-500 w-full">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-foreground leading-tight px-4">
                Olá! O que vamos fazer hoje?
              </h2>
            </div>
            
            <div className="flex flex-col space-y-4 w-full px-4">
              {/* Opção de Ler Remédio */}
              <div className="space-y-2">
                <p className="text-xl text-primary font-bold">Ver um remédio:</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleStartCapture('MEDICINE')}
                    className="h-32 rounded-3xl flex flex-col items-center justify-center space-y-2 shadow-lg bg-primary text-white"
                  >
                    <Camera className="w-8 h-8" />
                    <span className="text-lg">Tirar Foto</span>
                  </Button>
                  <Button
                    onClick={() => handleFileClick('MEDICINE')}
                    variant="secondary"
                    className="h-32 rounded-3xl flex flex-col items-center justify-center space-y-2 shadow-lg"
                  >
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-lg">Da Galeria</span>
                  </Button>
                </div>
              </div>

              {/* Opção de Ler Receita */}
              <div className="space-y-2 pt-4">
                <p className="text-xl text-secondary font-bold">Ler uma Receita:</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleStartCapture('PRESCRIPTION')}
                    className="h-32 rounded-3xl flex flex-col items-center justify-center space-y-2 shadow-lg bg-secondary text-white"
                  >
                    <Camera className="w-8 h-8" />
                    <span className="text-lg">Tirar Foto</span>
                  </Button>
                  <Button
                    onClick={() => handleFileClick('PRESCRIPTION')}
                    variant="secondary"
                    className="h-32 rounded-3xl flex flex-col items-center justify-center space-y-2 shadow-lg border-2 border-secondary/20"
                  >
                    <ImageIcon className="w-8 h-8 text-secondary" />
                    <span className="text-lg text-secondary">Da Galeria</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-primary font-bold pt-4">
              <Stethoscope className="w-6 h-6" />
              <span className="text-xl italic">Tudo bem simples pra senhora!</span>
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
          <div className="w-full flex flex-col items-center">
            <LoadingState 
              message={appMode === 'MEDICINE' ? "Estou lendo o remédio..." : "Estou lendo a receita..."} 
            />
            {locationStatus === 'GETTING' && (
              <div className="flex items-center gap-2 text-primary font-bold animate-pulse mt-4">
                <MapPin className="w-5 h-5" />
                <span>Buscando sua localização...</span>
              </div>
            )}
          </div>
        )}

        {appState === 'RESULT' && (
          <>
            {medicineResult && (
              <MedicineResult
                medicineName={medicineResult.medicineName}
                explanation={medicineResult.simpleExplanation}
                onReset={handleReset}
              />
            )}
            {prescriptionResult && (
              <PrescriptionResult
                data={prescriptionResult}
                onReset={handleReset}
              />
            )}
          </>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {appState === 'IDLE' && (
        <footer className="py-6 text-center text-muted-foreground/60 text-lg">
          Vovó Remédio Fácil - 2024
        </footer>
      )}
    </main>
  );
}
