
"use client"

import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Sparkles, MapPin, Heart, ArrowLeft } from 'lucide-react';
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
import Image from 'next/image';

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
    <main className="max-w-xl mx-auto min-h-screen flex flex-col bg-background font-body">
      {/* Header Wavy */}
      <header className="wavy-bg pt-12 pb-16 px-6 flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
            <Image 
              src="https://picsum.photos/seed/granny/100/100" 
              alt="Vovó Sorridente" 
              width={60} 
              height={60} 
              className="rounded-full border-2 border-white"
              data-ai-hint="smiling grandmother illustration"
            />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Vovó Remédio</h1>
        </div>
        {appState === 'IDLE' && (
           <p className="text-white/90 text-xl font-medium animate-fade-in text-center max-w-[280px]">
             Tire uma foto e descubra pra que serve! 💊
           </p>
        )}
      </header>

      <div className="flex-1 px-4 sm:px-8 py-6 -mt-8">
        {appState === 'IDLE' && (
          <div className="flex flex-col space-y-10 animate-fade-in">
            <div className="space-y-12">
              {/* Opção Ver Remédio */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                   <div className="bg-primary/10 p-2 rounded-xl">
                     <Heart className="w-5 h-5 text-primary fill-primary" />
                   </div>
                   <h2 className="text-2xl font-bold text-primary">Ver um Remédio</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    onClick={() => handleStartCapture('MEDICINE')}
                    className="h-36 rounded-[2.5rem] flex flex-col items-center justify-center space-y-3 btn-hover bg-primary text-white text-xl"
                  >
                    <div className="bg-white/20 p-3 rounded-full">
                      <Camera className="w-8 h-8" />
                    </div>
                    <span>Tirar Foto</span>
                  </Button>
                  <Button
                    onClick={() => handleFileClick('MEDICINE')}
                    variant="outline"
                    className="h-36 rounded-[2.5rem] flex flex-col items-center justify-center space-y-3 btn-hover border-primary/20 text-primary text-xl bg-white shadow-sm"
                  >
                    <div className="bg-primary/5 p-3 rounded-full">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <span>Da Galeria</span>
                  </Button>
                </div>
              </div>

              {/* Opção Ler Receita */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                   <div className="bg-secondary/10 p-2 rounded-xl">
                     <Sparkles className="w-5 h-5 text-secondary fill-secondary" />
                   </div>
                   <h2 className="text-2xl font-bold text-secondary">Ler uma Receita</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    onClick={() => handleStartCapture('PRESCRIPTION')}
                    className="h-36 rounded-[2.5rem] flex flex-col items-center justify-center space-y-3 btn-hover bg-secondary text-white text-xl"
                  >
                    <div className="bg-white/20 p-3 rounded-full">
                      <Camera className="w-8 h-8" />
                    </div>
                    <span>Tirar Foto</span>
                  </Button>
                  <Button
                    onClick={() => handleFileClick('PRESCRIPTION')}
                    variant="outline"
                    className="h-36 rounded-[2.5rem] flex flex-col items-center justify-center space-y-3 btn-hover border-secondary/20 text-secondary text-xl bg-white shadow-sm"
                  >
                    <div className="bg-secondary/5 p-3 rounded-full">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <span>Da Galeria</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-10 pb-6 text-center space-y-2 opacity-50">
              <p className="text-lg italic text-muted-foreground">Tudo bem simples pra senhora! ✨</p>
              <p className="text-sm">Feito com carinho para as nossas vovós</p>
            </div>
          </div>
        )}

        {appState === 'CAPTURING' && (
          <div className="fixed inset-0 z-50 bg-black">
            <CameraCapture 
              onCapture={handlePhotoCaptured} 
              onCancel={() => setAppState('IDLE')} 
            />
          </div>
        )}

        {appState === 'PROCESSING' && (
          <div className="w-full flex flex-col items-center py-10">
            <LoadingState 
              message={appMode === 'MEDICINE' ? "Estou lendo o remédio..." : "Estou lendo a receita..."} 
            />
            {locationStatus === 'GETTING' && (
              <div className="flex items-center gap-3 bg-white px-8 py-4 rounded-full shadow-lg border border-primary/10 animate-pulse mt-8">
                <MapPin className="w-6 h-6 text-primary" />
                <span className="text-xl text-primary font-bold">Buscando farmácias...</span>
              </div>
            )}
          </div>
        )}

        {appState === 'RESULT' && (
          <div className="w-full pb-10">
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 text-primary font-bold mb-6 hover:translate-x-1 transition-transform"
            >
              <ArrowLeft className="w-6 h-6" />
              <span>Voltar ao início</span>
            </button>

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
    </main>
  );
}
