"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, Sparkles, MapPin, Heart, ArrowLeft, History, Clock, PhoneCall, AlertCircle, Trash2, HelpCircle, ChevronRight, Bell, FileText, Pill } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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
    const updatedHistory = [newItem, ...history].slice(0, 20);
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
    <div className="bg-background font-body text-on-background min-h-screen flex flex-col selection:bg-primary/20">
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shadow-sm">
             <Image 
                src="https://picsum.photos/seed/granny-v3/100/100" 
                alt="Vovó" 
                width={48} 
                height={48} 
                className="rounded-full object-cover border-2 border-white"
                data-ai-hint="smiling grandmother"
              />
          </div>
          <h1 className="font-headline text-2xl font-extrabold text-primary">MedGrandma AI</h1>
        </div>
        <button className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-variant">
          <HelpCircle className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 px-6 pt-8 pb-32 space-y-10 max-w-2xl mx-auto w-full animate-fade-in">
        
        {appState === 'IDLE' && (
          <>
            {/* Welcome Section */}
            <section className="space-y-4">
              <div className="inline-block px-4 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-sm font-semibold tracking-wider uppercase">
                Bem-vinda, vovó!
              </div>
              <h2 className="font-headline text-4xl leading-tight text-on-background font-extrabold">
                Como você está hoje? Vamos cuidar da saúde?
              </h2>
            </section>

            {/* Main Action Cards (Asymmetric Bento) */}
            <section className="grid grid-cols-1 gap-6">
              {/* Action 1: Tirar Foto */}
              <button 
                onClick={() => handleStartCapture('MEDICINE')}
                className="group relative w-full overflow-hidden bg-primary-container rounded-[2rem] p-8 text-left transition-all active:scale-[0.96] ambient-float hover:shadow-xl"
              >
                <div className="flex flex-col h-full justify-between gap-6">
                  <div className="w-20 h-20 bg-surface-container-lowest rounded-full flex items-center justify-center pillow-shadow">
                    <Pill className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline text-3xl text-on-primary-container mb-2 font-extrabold">Identificar Remédio</h3>
                    <p className="text-on-primary-container/80 text-lg leading-snug">Tire uma foto para saber o que é e como tomar!</p>
                  </div>
                </div>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
              </button>

              {/* Action 2: Ler Receita */}
              <button 
                onClick={() => handleStartCapture('PRESCRIPTION')}
                className="group relative w-full overflow-hidden bg-secondary-container rounded-[2rem] p-8 text-left transition-all active:scale-[0.96] ambient-float hover:shadow-xl"
              >
                <div className="flex flex-col h-full justify-between gap-6">
                  <div className="w-20 h-20 bg-surface-container-lowest rounded-full flex items-center justify-center pillow-shadow">
                    <FileText className="w-10 h-10 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-headline text-3xl text-on-secondary-container mb-2 font-extrabold">Ler Receita Médica</h3>
                    <p className="text-on-secondary-container/80 text-lg leading-snug">Não entende a letra do médico? Eu leio para você!</p>
                  </div>
                </div>
              </button>
            </section>

            {/* Dica da Vovó Card */}
            <section className="bg-surface-container-low rounded-[2rem] p-8 relative overflow-hidden border border-white/50">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="organic-blob w-24 h-24 bg-tertiary-container flex-shrink-0 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-10 h-10 text-on-tertiary-container" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-headline text-xl text-tertiary font-bold tracking-tight">Dica do MedGrandma</h4>
                  <p className="text-on-surface text-xl leading-relaxed italic">
                    "Lembre-se de beber um copinho d'água agora, meu bem. Hidratação é saúde!"
                  </p>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary-fixed opacity-10 rounded-full -mr-16 -mt-16"></div>
            </section>

            {/* Próximo Remédio bar */}
            <div 
              onClick={() => setAppState('SCHEDULE')}
              className="bg-surface-container-high rounded-full p-6 flex items-center justify-between ambient-float cursor-pointer hover:bg-surface-variant transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center pillow-shadow">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <span className="font-semibold text-lg text-on-surface">Próximo remédio: <span className="text-primary">15:00</span></span>
              </div>
              <ChevronRight className="w-6 h-6 text-primary" />
            </div>

            {/* Emergência Button */}
            <Button
              onClick={() => setShowEmergencyDialog(true)}
              className="h-20 rounded-[2rem] bg-error hover:bg-red-700 text-white flex items-center justify-center gap-4 shadow-xl border-b-4 border-black/10 w-full"
            >
              <PhoneCall className="w-8 h-8" />
              <span className="text-xl font-extrabold uppercase tracking-tight">Emergência (SAMU)</span>
            </Button>
          </>
        )}

        {appState === 'HISTORY' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
               <button onClick={() => setAppState('IDLE')} className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
                 <ArrowLeft className="w-6 h-6 text-primary" />
               </button>
               <h2 className="font-headline text-3xl font-extrabold">Meu Histórico</h2>
            </div>
            
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="bg-surface-container-low rounded-[2rem] p-12 text-center space-y-4">
                  <History className="w-16 h-16 text-primary/20 mx-auto" />
                  <p className="text-xl text-muted-foreground font-medium">A senhora ainda não guardou nada aqui. Suas leituras vão aparecer aqui depois!</p>
                </div>
              ) : (
                history.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleOpenHistoryItem(item)}
                    className="bg-white rounded-[1.5rem] p-6 flex items-center justify-between cursor-pointer hover:bg-primary-container/20 transition-all ambient-float border border-white"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${item.type === 'MEDICINE' ? 'bg-primary-container text-primary' : 'bg-secondary-container text-secondary'}`}>
                        {item.type === 'MEDICINE' ? <Pill className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
                      </div>
                      <div>
                        <h4 className="font-headline font-bold text-xl text-on-background">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.date}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-primary/30" />
                  </div>
                ))
              )}
            </div>

            {history.length > 0 && (
              <Button variant="ghost" onClick={clearHistory} className="w-full text-error font-bold text-lg h-16 rounded-[1.5rem]">
                <Trash2 className="w-5 h-5 mr-2" /> Limpar Histórico
              </Button>
            )}
          </div>
        )}

        {appState === 'SCHEDULE' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
               <button onClick={() => setAppState('IDLE')} className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
                 <ArrowLeft className="w-6 h-6 text-primary" />
               </button>
               <h2 className="font-headline text-3xl font-extrabold">Horários</h2>
            </div>

            <div className="bg-surface-container-low p-8 rounded-[2rem] border-2 border-primary/10 shadow-inner">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-primary mt-1" />
                <p className="text-on-background text-lg font-medium leading-relaxed">
                  Vovó, aqui a senhora pode ver os horários que o médico mandou tomar os remédios para não esquecer!
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-primary-container/30 p-8 rounded-[2rem] flex items-center justify-between border-l-8 border-primary ambient-float">
                <div>
                  <span className="bg-primary text-white font-bold px-4 py-1 rounded-full text-sm uppercase tracking-wider">Às 08:00</span>
                  <h4 className="text-2xl font-extrabold text-on-background mt-3">Remédio de Pressão</h4>
                  <p className="text-on-surface-variant font-medium">1 comprimido em jejum</p>
                </div>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center pillow-shadow">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
              </div>

              <div className="bg-surface-container p-8 rounded-[2rem] flex items-center justify-between opacity-60 border-l-8 border-outline">
                <div>
                  <span className="bg-outline text-white font-bold px-4 py-1 rounded-full text-sm uppercase tracking-wider">Às 20:00</span>
                  <h4 className="text-2xl font-extrabold text-on-background mt-3">Remédio do Colesterol</h4>
                  <p className="text-on-surface-variant font-medium">Depois do jantar</p>
                </div>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center pillow-shadow">
                  <Clock className="w-8 h-8 text-outline" />
                </div>
              </div>
            </div>
            
            <Button className="h-20 w-full rounded-[2rem] bg-primary text-white text-xl font-bold shadow-lg">
              Adicionar novo horário
            </Button>
          </div>
        )}

        {appState === 'CAPTURING' && (
          <div className="fixed inset-0 z-[100] bg-black">
            <CameraCapture 
              onCapture={handlePhotoCaptured} 
              onCancel={() => setAppState('IDLE')} 
              onFileSelect={() => handleFileClick(appMode)}
            />
          </div>
        )}

        {appState === 'PROCESSING' && (
          <div className="w-full flex flex-col items-center py-10 animate-fade-in">
            <LoadingState 
              message={appMode === 'MEDICINE' ? "Lendo seu remédio..." : "Lendo sua receita..."} 
            />
            {locationStatus === 'GETTING' && (
              <div className="flex items-center gap-4 bg-white px-10 py-6 rounded-[2.5rem] shadow-2xl border-4 border-primary/10 animate-pulse mt-8">
                <MapPin className="w-10 h-10 text-primary" />
                <span className="text-2xl text-primary font-bold">Buscando farmácias...</span>
              </div>
            )}
          </div>
        )}

        {appState === 'RESULT' && (
          <div className="w-full pb-10">
            <button 
              onClick={handleReset}
              className="flex items-center gap-3 text-primary font-extrabold mb-10 bg-white/50 px-8 py-4 rounded-full shadow-sm hover:bg-white transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
              <span className="text-xl">Voltar ao Início</span>
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
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface-container-highest/90 backdrop-blur-xl border-t border-outline-variant/15 px-6 pb-8 pt-4 z-[40]">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <button 
            onClick={() => setAppState('IDLE')}
            className={cn("flex flex-col items-center gap-1 group transition-all", appState === 'IDLE' ? "scale-110" : "opacity-60")}
          >
            <div className={cn("w-16 h-10 rounded-full flex items-center justify-center transition-all", appState === 'IDLE' ? "bg-primary-container text-on-primary-container" : "hover:bg-surface-variant text-on-surface-variant")}>
              <Heart className={cn("w-6 h-6", appState === 'IDLE' && "fill-primary")} />
            </div>
            <span className="text-sm font-bold">Início</span>
          </button>
          
          <button 
            onClick={() => setAppState('HISTORY')}
            className={cn("flex flex-col items-center gap-1 group transition-all", appState === 'HISTORY' ? "scale-110" : "opacity-60")}
          >
            <div className={cn("w-16 h-10 rounded-full flex items-center justify-center transition-all", appState === 'HISTORY' ? "bg-primary-container text-on-primary-container" : "hover:bg-surface-variant text-on-surface-variant")}>
              <History className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold">Histórico</span>
          </button>

          <button 
            onClick={() => setAppState('SCHEDULE')}
            className={cn("flex flex-col items-center gap-1 group transition-all", appState === 'SCHEDULE' ? "scale-110" : "opacity-60")}
          >
            <div className={cn("w-16 h-10 rounded-full flex items-center justify-center transition-all", appState === 'SCHEDULE' ? "bg-primary-container text-on-primary-container" : "hover:bg-surface-variant text-on-surface-variant")}>
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold">Horários</span>
          </button>
        </div>
      </nav>

      {/* Emergency Dialog */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent className="max-w-sm rounded-[3rem] p-10 text-center space-y-8 bg-surface border-none shadow-2xl">
          <div className="bg-error-container w-28 h-28 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <PhoneCall className="w-14 h-14 text-error" />
          </div>
          <DialogHeader>
            <DialogTitle className="font-headline text-3xl font-extrabold text-error">Chamar o SAMU?</DialogTitle>
            <DialogDescription className="text-xl font-medium mt-4 text-on-surface">
              Vovó, a senhora precisa de ajuda urgente? 
              Vou ligar para o 192 (SAMU) agora mesmo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-4 sm:flex-col">
            <Button 
              className="h-20 w-full rounded-[2rem] bg-error text-white text-2xl font-bold shadow-lg"
              onClick={() => {
                window.location.href = 'tel:192';
                setShowEmergencyDialog(false);
              }}
            >
              Ligar Agora (192)
            </Button>
            <Button 
              variant="outline" 
              className="h-16 w-full rounded-[2rem] border-2 border-outline/30 text-on-surface-variant font-bold text-lg"
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
    </div>
  );
}
