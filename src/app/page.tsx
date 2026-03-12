
"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, Sparkles, MapPin, Heart, ArrowLeft, History, Clock, PhoneCall, AlertCircle, Trash2 } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';

type AppMode = 'MEDICINE' | 'PRESCRIPTION';
type AppState = 'IDLE' | 'CAPTURING' | 'PROCESSING' | 'RESULT' | 'HISTORY' | 'SCHEDULE';

interface HistoryItem {
  id: string;
  date: string;
  type: AppMode;
  title: string;
  data: any;
}

export default function Home() {
  const [appMode, setAppMode] = useState<AppMode>('MEDICINE');
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [medicineResult, setMedicineResult] = useState<MedicineExplanationOutput | null>(null);
  const [prescriptionResult, setPrescriptionResult] = useState<ReadPrescriptionOutput | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [locationStatus, setLocationStatus] = useState<'IDLE' | 'GETTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Carregar histórico do localStorage na montagem
  useEffect(() => {
    const savedHistory = localStorage.getItem('vovo_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (type: AppMode, title: string, data: any) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('pt-BR'),
      type,
      title,
      data
    };
    const updatedHistory = [newItem, ...history].slice(0, 20); // Mantém os últimos 20
    setHistory(updatedHistory);
    localStorage.setItem('vovo_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('vovo_history');
    toast({ title: "Histórico limpo!", description: "Tudo limpinho como um brinco, vovó!" });
  };

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
        saveToHistory('MEDICINE', output.medicineName, output);
      } else {
        const userLocation = await getUserLocation();
        const output = await readPrescription({ 
          photoDataUri,
          userLocation 
        });
        setPrescriptionResult(output);
        saveToHistory('PRESCRIPTION', `Receita (${new Date().toLocaleDateString()})`, output);
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

  const handleOpenHistoryItem = (item: HistoryItem) => {
    if (item.type === 'MEDICINE') {
      setMedicineResult(item.data);
      setPrescriptionResult(null);
    } else {
      setPrescriptionResult(item.data);
      setMedicineResult(null);
    }
    setAppState('RESULT');
  };

  return (
    <main className="max-w-xl mx-auto min-h-screen flex flex-col bg-[#FCF9F2] font-body relative overflow-hidden">
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
             Tudo bem explicadinho para a senhora! 🌸
           </p>
        )}
      </header>

      <div className="flex-1 px-4 sm:px-8 py-8 -mt-10 relative z-10">
        {appState === 'IDLE' && (
          <div className="flex flex-col space-y-8 animate-fade-in">
            {/* Seção Principal: Fotos */}
            <div className="grid grid-cols-1 gap-6">
              <div className="card-elegant p-6 space-y-4 border-2 border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-primary">Ver Remédio ou Receita</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => handleStartCapture('MEDICINE')}
                    className="h-32 rounded-[2rem] flex flex-col items-center justify-center space-y-2 btn-hover bg-primary text-white"
                  >
                    <Camera className="w-8 h-8" />
                    <span className="font-bold text-lg">Câmera</span>
                  </Button>
                  <Button
                    onClick={() => handleFileClick('MEDICINE')}
                    variant="outline"
                    className="h-32 rounded-[2rem] flex flex-col items-center justify-center space-y-2 btn-hover border-primary/30 text-primary bg-white shadow-sm"
                  >
                    <ImageIcon className="w-8 h-8" />
                    <span className="font-bold text-lg">Galeria</span>
                  </Button>
                </div>
                <p className="text-center text-primary/60 italic font-medium">Aperte aqui para ler um remédio ou receita médica! ✨</p>
              </div>
            </div>

            {/* Ações Rápidas Abaixo */}
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setAppState('HISTORY')}
                  className="h-28 rounded-[2rem] flex flex-col items-center justify-center gap-1 btn-hover bg-white border-2 border-accent text-accent-foreground shadow-md"
                >
                  <History className="w-8 h-8" />
                  <span className="font-bold">Histórico</span>
                </Button>
                <Button
                  onClick={() => setAppState('SCHEDULE')}
                  className="h-28 rounded-[2rem] flex flex-col items-center justify-center gap-1 btn-hover bg-white border-2 border-secondary text-secondary-foreground shadow-md"
                >
                  <Clock className="w-8 h-8" />
                  <span className="font-bold">Horários</span>
                </Button>
              </div>

              {/* Botão Emergência - BEM GRANDE */}
              <Button
                onClick={() => setShowEmergencyDialog(true)}
                className="h-24 rounded-[2rem] bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-4 shadow-xl animate-pulse border-b-4 border-red-800"
              >
                <div className="bg-white/20 p-2 rounded-full">
                  <PhoneCall className="w-10 h-10" />
                </div>
                <span className="text-2xl font-black uppercase tracking-tighter">Chamar Ambulância</span>
              </Button>
            </div>

            <div className="pt-8 text-center opacity-40">
              <Heart className="w-6 h-6 mx-auto text-primary fill-primary" />
              <p className="text-sm font-bold uppercase tracking-widest mt-2">Feito com muito amor</p>
            </div>
          </div>
        )}

        {/* Visualização de Histórico */}
        {appState === 'HISTORY' && (
          <div className="space-y-6 animate-fade-in">
            <button 
              onClick={() => setAppState('IDLE')}
              className="flex items-center gap-2 text-primary font-bold mb-4 bg-white px-4 py-2 rounded-full shadow-sm"
            >
              <ArrowLeft className="w-6 h-6" /> Voltar
            </button>
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-primary">Meus Lembretes</h2>
              {history.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearHistory} className="text-red-400">
                  <Trash2 className="w-4 h-4 mr-1" /> Limpar tudo
                </Button>
              )}
            </div>
            
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="card-elegant p-10 text-center space-y-4">
                  <Sparkles className="w-12 h-12 text-primary/20 mx-auto" />
                  <p className="text-xl text-muted-foreground">A senhora ainda não guardou nada aqui. Suas leituras vão aparecer aqui depois!</p>
                </div>
              ) : (
                history.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleOpenHistoryItem(item)}
                    className="card-elegant p-5 flex items-center justify-between cursor-pointer hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${item.type === 'MEDICINE' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                        {item.type === 'MEDICINE' ? <Heart className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.date}</p>
                      </div>
                    </div>
                    <ArrowLeft className="w-5 h-5 rotate-180 text-primary/30" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Visualização de Horários */}
        {appState === 'SCHEDULE' && (
          <div className="space-y-6 animate-fade-in">
            <button 
              onClick={() => setAppState('IDLE')}
              className="flex items-center gap-2 text-primary font-bold mb-4 bg-white px-4 py-2 rounded-full shadow-sm"
            >
              <ArrowLeft className="w-6 h-6" /> Voltar
            </button>
            <h2 className="text-3xl font-bold text-primary">Horário dos Remédios</h2>
            
            <div className="space-y-6">
              <div className="bg-yellow-50 p-6 rounded-[2rem] border-2 border-yellow-200 shadow-inner">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 mt-1" />
                  <p className="text-yellow-800 font-medium">Vovó, aqui a senhora pode anotar os horários que o médico mandou tomar os remédios.</p>
                </div>
              </div>

              {/* Lista de Exemplo - No futuro pode ser editável */}
              <div className="space-y-4">
                <div className="card-elegant p-6 border-l-8 border-primary flex items-center justify-between">
                  <div>
                    <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-sm">Próximo: 08:00</span>
                    <h4 className="text-xl font-bold mt-2">Remédio de Pressão</h4>
                    <p className="text-muted-foreground">1 comprimido em jejum</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Clock className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="card-elegant p-6 border-l-8 border-secondary flex items-center justify-between opacity-60">
                  <div>
                    <span className="bg-secondary/10 text-secondary font-bold px-3 py-1 rounded-full text-sm">Às 20:00</span>
                    <h4 className="text-xl font-bold mt-2">Remédio do Colesterol</h4>
                    <p className="text-muted-foreground">Depois do jantar</p>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-full">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
              </div>

              <Button className="w-full h-20 rounded-[2rem] text-xl font-bold bg-white border-2 border-primary/20 text-primary shadow-sm">
                + Adicionar novo horário
              </Button>
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

      {/* Dialog de Emergência */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent className="max-w-sm rounded-[3rem] p-10 text-center space-y-8">
          <div className="bg-red-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
            <PhoneCall className="w-12 h-12 text-red-600" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-red-600">Ligar para o SAMU?</DialogTitle>
            <DialogDescription className="text-xl font-medium mt-4">
              Vovó, a senhora precisa de ajuda urgente? 
              Vou ligar para o 192 para a senhora.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-4 sm:flex-col">
            <Button 
              className="h-20 w-full rounded-[2rem] bg-red-600 text-white text-2xl font-bold"
              onClick={() => {
                window.location.href = 'tel:192';
                setShowEmergencyDialog(false);
              }}
            >
              Ligar Agora (192)
            </Button>
            <Button 
              variant="outline" 
              className="h-16 w-full rounded-[2rem] border-2 border-gray-200 text-gray-500 font-bold"
              onClick={() => setShowEmergencyDialog(false)}
            >
              Não, foi engano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
