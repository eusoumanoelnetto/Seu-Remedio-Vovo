"use client"

import React, { useState, useRef } from 'react';
import { Camera, Heart, Stethoscope, Image as ImageIcon, Sparkles, MapPin } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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
    <main className="max-w-xl mx-auto min-h-screen flex flex-col p-4 sm:p-8 font-body bg-gradient-to-b from-background to-accent/30">
      <header className="flex flex-col items-center justify-center space-y-4 py-10 animate-fade-in">
        <div className="bg-white p-5 rounded-[2.5rem] shadow-xl border-4 border-primary/10">
          <Heart className="w-10 h-10 text-primary fill-primary" />
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">Vovó Remédio</h1>
          <p className="text-lg text-muted-foreground font-medium">Cuidando com carinho e clareza</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {appState === 'IDLE' && (
          <div className="flex flex-col space-y-10 w-full animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-foreground px-4">
              Olá! O que vamos fazer hoje?
            </h2>
            
            <div className="space-y-10 w-full px-2">
              {/* Seção Remédio */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-4">
                  <div className="w-2 h-8 bg-primary rounded-full" />
                  <p className="text-2xl text-primary font-bold">Ver um Remédio</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    onClick={() => handleStartCapture('MEDICINE')}
                    className="h-32 rounded-[2rem] flex flex-col items-center justify-center space-y-2 btn-hover bg-primary text-white text-xl"
                  >
                    <Camera className="w-8 h-8" />
                    <span>Tirar Foto</span>
                  </Button>
                  <Button
                    onClick={() => handleFileClick('MEDICINE')}
                    variant="outline"
                    className="h-32 rounded-[2rem] flex flex-col items-center justify-center space-y-2 btn-hover border-primary/20 text-primary text-xl bg-white"
                  >
                    <ImageIcon className="w-8 h-8" />
                    <span>Da Galeria</span>
                  </Button>
                </div>
              </div>

              {/* Seção Receita */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-4">
                  <div className="w-2 h-8 bg-secondary rounded-full" />
                  <p className="text-2xl text-secondary font-bold">Ler uma Receita</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    onClick={() => handleStartCapture('PRESCRIPTION')}
                    className="h-32 rounded-[2rem] flex flex-col items-center justify-center space-y-2 btn-hover bg-secondary text-white text-xl"
                  >
                    <Camera className="w-8 h-8" />
                    <span>Tirar Foto</span>
                  </Button>
                  <Button
                    onClick={() => handleFileClick('PRESCRIPTION')}
                    variant="outline"
                    className="h-32 rounded-[2rem] flex flex-col items-center justify-center space-y-2 btn-hover border-secondary/20 text-secondary text-xl bg-white"
                  >
                    <ImageIcon className="w-8 h-8" />
                    <span>Da Galeria</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-3 text-primary/70 font-bold pt-8">
              <Sparkles className="w-6 h-6" />
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
              <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-primary/10 animate-pulse mt-6">
                <MapPin className="w-6 h-6 text-primary" />
                <span className="text-lg text-primary font-bold">Buscando farmácias próximas...</span>
              </div>
            )}
          </div>
        )}

        {appState === 'RESULT' && (
          <div className="w-full">
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
          </div>
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
        <footer className="py-10 text-center text-muted-foreground/40 text-lg">
          Vovó Remédio Fácil • Feito com amor
        </footer>
      )}
    </main>
  );
}