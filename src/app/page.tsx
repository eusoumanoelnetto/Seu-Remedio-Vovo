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
    <main className="max-w-xl mx-auto min-h-screen flex flex-col bg-background font-body relative overflow-hidden">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-20 -right-10 opacity-10 pointer-events-none">
        <Image src="https://picsum.photos/seed/flower1/200/200" alt="" width={200} height={200} data-ai-hint="flower watercolor" />
      </div>
      <div className="absolute bottom-40 -left-10 opacity-10 pointer-events-none rotate-12">
        <Image src="https://picsum.photos/seed/flower2/150/150" alt="" width={150} height={150} data-ai-hint="garden flower" />
      </div>

      {/* Header Wavy */}
      <header className="wavy-bg pt-12 pb-20 px-6 flex flex-col items-center justify-center space-y-4 shadow-lg">
        <div className="flex items-center space-x-4 animate-fade-in">
          <div className="bg-white/30 p-1 rounded-full backdrop-blur-md border-2 border-white/50">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white">
              <Image 
                src="https://picsum.photos/seed/granny-v3/200/200" 
                alt="Vovó Sorridente" 
                fill
                className="object-cover"
                data-ai-hint="smiling grandmother"
              />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-sm">Vovó Remédio</h1>
            <div className="bg-white/20 h-1 w-full rounded-full mt-1" />
          </div>
        </div>
        {appState === 'IDLE' && (
           <p className="text-white/95 text-xl font-medium animate-fade-in text-center max-w-[300px] leading-snug">
             Tire uma foto e descubra pra que serve cada coisinha! 🌸
           </p>
        )}
      </header>

      <div className="flex-1 px-4 sm:px-8 py-8 -mt-10 relative z-10">
        {appState === 'IDLE' && (
          <div className="flex flex-col space-y-12 animate-fade-in">
            <div className="space-y-14">
              {/* Opção Ver Remédio */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                   <div className="bg-primary/10 p-2 rounded-2xl shadow-inner">
                     <Heart className="w-6 h-6 text-primary fill-primary/40" />
                   </div>
                   <h2 className="text-2xl font-bold text-primary">Ver um Remédio</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    onClick={() => handleStartCapture('MEDICINE')}
                    className="h-44 rounded-[3rem] flex flex-col items-center justify-center space-y-3 btn-hover bg-primary text-white text-xl border-b-8 border-primary-foreground/10"
                  >
                    <div className="bg-white/20 p-4 rounded-full shadow-lg">
                      <Camera className="w-10 h-10" />
                    </div>
                    <span className="font-bold">Tirar Foto</span>
                  </Button>
                  <Button
                    onClick={() => handleFileClick('MEDICINE')}
                    variant="outline"
                    className="h-44 rounded-[3rem] flex flex-col items-center justify-center space-y-3 btn-hover border-primary/20 text-primary text-xl bg-white/80 backdrop-blur-sm shadow-md"
                  >
                    <div className="bg-primary/5 p-4 rounded-full border border-primary/10">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                    <span className="font-bold">Da Galeria</span>
                  </Button>
                </div>
              </div>

              {/* Opção Ler Receita */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                   <div className="bg-secondary/10 p-2 rounded-2xl shadow-inner">
                     <Sparkles className="w-6 h-6 text-secondary fill-secondary/40" />
                   </div>
                   <h2 className="text-2xl font-bold text-secondary">Ler uma Receita</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    onClick={() => handleStartCapture('PRESCRIPTION')}
                    className="h-44 rounded-[3rem] flex flex-col items-center justify-center space-y-3 btn-hover bg-secondary text-white text-xl border-b-8 border-secondary-foreground/10"
                  >
                    <div className="bg-white/20 p-4 rounded-full shadow-lg">
                      <Camera className="w-10 h-10" />
                    </div>
                    <span className="font-bold">Tirar Foto</span>
                  </Button>
                  <Button
                    onClick={() => handleFileClick('PRESCRIPTION')}
                    variant="outline"
                    className="h-44 rounded-[3rem] flex flex-col items-center justify-center space-y-3 btn-hover border-secondary/20 text-secondary text-xl bg-white/80 backdrop-blur-sm shadow-md"
                  >
                    <div className="bg-secondary/5 p-4 rounded-full border border-secondary/10">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                    <span className="font-bold">Da Galeria</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-12 pb-8 text-center space-y-4">
              <div className="flex justify-center items-center gap-4 opacity-30">
                <Heart className="w-6 h-6 text-primary fill-primary" />
                <div className="h-px w-20 bg-primary/50" />
                <Heart className="w-6 h-6 text-primary fill-primary" />
              </div>
              <p className="text-xl italic text-primary/60 font-medium">Tudo bem simples pra senhora! ✨</p>
              <div className="relative inline-block">
                 <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Feito com muito amor</p>
                 <div className="absolute -right-6 -top-2 rotate-12">
                   <Heart className="w-4 h-4 text-red-400 fill-red-400 animate-pulse" />
                 </div>
              </div>
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
              <div className="flex items-center gap-4 bg-white px-10 py-5 rounded-[2.5rem] shadow-2xl border-4 border-primary/20 animate-pulse mt-8">
                <div className="bg-primary/10 p-2 rounded-full">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <span className="text-2xl text-primary font-bold">Buscando farmácias...</span>
              </div>
            )}
          </div>
        )}

        {appState === 'RESULT' && (
          <div className="w-full pb-10">
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 text-primary font-bold mb-8 hover:-translate-x-1 transition-transform bg-white/50 px-6 py-3 rounded-full shadow-sm border border-primary/10"
            >
              <ArrowLeft className="w-6 h-6" />
              <span className="text-lg">Voltar ao início</span>
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
