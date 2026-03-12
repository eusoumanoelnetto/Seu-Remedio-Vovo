
"use client"

import React, { useState, useRef } from 'react';
import { Chrome, Loader2, Heart } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { collection, doc, setDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type AppMode = 'MEDICINE' | 'PRESCRIPTION';
type AppState = 'INICIO' | 'CAPTURING' | 'PROCESSING' | 'RESULT' | 'RECEITAS' | 'AVISO' | 'CONTA';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const [appMode, setAppMode] = useState<AppMode>('MEDICINE');
  const [appState, setAppState] = useState<AppState>('INICIO');
  const [medicineResult, setMedicineResult] = useState<MedicineExplanationOutput | null>(null);
  const [prescriptionResult, setPrescriptionResult] = useState<ReadPrescriptionOutput | null>(null);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firestore Data
  const scansQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'medicine_scans'),
      orderBy('scanDateTime', 'desc')
    );
  }, [db, user]);

  const { data: scansHistory, isLoading: isHistoryLoading } = useCollection(scansQuery);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        profileImageUrl: user.photoURL,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });
      
      toast({ title: "Bem-vinda, vovó!", description: `Que bom ter a senhora aqui, ${user.displayName}!` });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Ih, deu um erro!", 
        description: "Não conseguimos entrar com o Google agora. Peça para alguém ativar o 'Google' em 'Authentication' no Console do Firebase." 
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setAppState('INICIO');
    toast({ title: "Até logo!", description: "Espero ver a senhora em breve, vovó!" });
  };

  const getUserLocation = (): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(undefined);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = `Cidade Próxima (Lat: ${position.coords.latitude.toFixed(2)}, Long: ${position.coords.longitude.toFixed(2)})`;
          resolve(loc);
        },
        () => resolve(undefined),
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
        if (user) {
          addDocumentNonBlocking(collection(db, 'users', user.uid, 'medicine_scans'), {
            userId: user.uid,
            scannedImageUrl: photoDataUri,
            medicineName: output.medicineName,
            simplifiedExplanation: output.simpleExplanation,
            scanDateTime: new Date().toISOString(),
          });
        }
      } else {
        const userLocation = await getUserLocation();
        const output = await readPrescription({ photoDataUri, userLocation });
        setPrescriptionResult(output);
        if (user) {
          addDocumentNonBlocking(collection(db, 'users', user.uid, 'medicine_scans'), {
            userId: user.uid,
            scannedImageUrl: photoDataUri,
            medicineName: `Receita identificada`,
            simplifiedExplanation: `Receita com ${output.medicines.length} itens identificados.`,
            scanDateTime: new Date().toISOString(),
            rawAiResponse: JSON.stringify(output)
          });
        }
      }
      setAppState('RESULT');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ih, vovó!",
        description: "Houve um probleminha ao ler a foto. Tente novamente!",
      });
      setAppState('INICIO');
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
    setMedicineResult(null);
    setPrescriptionResult(null);
    setAppState('INICIO');
  };

  const handleOpenHistoryItem = (item: any) => {
    if (item.rawAiResponse) {
      setPrescriptionResult(JSON.parse(item.rawAiResponse));
      setMedicineResult(null);
    } else {
      setMedicineResult({
        medicineName: item.medicineName,
        simpleExplanation: item.simplifiedExplanation
      });
      setPrescriptionResult(null);
    }
    setAppState('RESULT');
  };

  if (isUserLoading) return <LoadingState message="Preparando seu cantinho..." />;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-12 animate-fade-in selection:bg-primary-container">
        <div className="w-32 h-32 organic-blob bg-secondary-container flex items-center justify-center text-on-secondary-container shadow-xl animate-bounce">
          <span className="material-symbols-outlined text-7xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
        </div>
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight leading-tight">Seu Remédio Vovó</h1>
          <p className="text-xl text-on-surface-variant font-medium">
            Seu assistente carinhoso para cuidar da saúde. Entre para salvar seus remédios!
          </p>
        </div>
        <div className="w-full max-w-xs space-y-4">
          <Button 
            onClick={handleGoogleSignIn}
            disabled={isLoggingIn}
            className="w-full h-16 rounded-full bg-white text-on-surface border-2 border-outline/20 flex items-center justify-center gap-3 text-lg font-bold shadow-md hover:bg-surface-variant transition-all"
          >
            {isLoggingIn ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <Chrome className="w-6 h-6 text-primary" />}
            {isLoggingIn ? "Entrando..." : "Entrar com Google"}
          </Button>
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground italic font-medium">"Um abraço de vovó em cada cuidado."</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background font-body text-on-background min-h-screen flex flex-col selection:bg-primary-container">
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shadow-sm border-2 border-white overflow-hidden">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Vovó" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>face_6</span>
            )}
          </div>
          <h1 className="font-headline text-xl font-extrabold text-primary tracking-tight">Olá, {user.displayName?.split(' ')[0] || 'Vovó'}!</h1>
        </div>
        <button onClick={() => setAppState('CONTA')} className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 0" }}>account_circle</span>
        </button>
      </header>

      <main className="flex-1 px-6 pt-4 pb-32 space-y-10 max-w-2xl mx-auto w-full animate-fade-in">
        
        {appState === 'INICIO' && (
          <>
            <section className="text-center space-y-2 py-6">
              <span className="inline-block px-4 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs uppercase tracking-widest">
                ABRAÇO DE VOVÓ
              </span>
              <h2 className="font-headline text-4xl leading-tight text-on-background font-extrabold tracking-tight">
                Seu Remédio Vovó
              </h2>
              <p className="text-on-surface-variant font-medium">Como posso te ajudar hoje, meu anjo?</p>
            </section>

            <section className="grid grid-cols-1 gap-6">
              {/* Action 1: Remédio */}
              <button 
                onClick={() => handleStartCapture('MEDICINE')}
                className="group relative w-full overflow-hidden bg-primary-container rounded-xl p-8 text-left transition-transform active:scale-[0.96] ambient-float border border-white/40"
              >
                <div className="flex flex-col h-full justify-between gap-6">
                  <div className="w-20 h-20 bg-surface-container-lowest rounded-full flex items-center justify-center pillow-shadow">
                    <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>medication</span>
                  </div>
                  <div>
                    <h3 className="font-headline text-3xl text-on-primary-container mb-2 font-extrabold">Tirar Foto do Remédio</h3>
                    <p className="text-on-primary-container/80 text-lg leading-snug font-medium">Vou te ajudar a saber o que é e como tomar!</p>
                  </div>
                </div>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
              </button>

              {/* Action 2: Receita */}
              <button 
                onClick={() => handleStartCapture('PRESCRIPTION')}
                className="group relative w-full overflow-hidden bg-secondary-container rounded-xl p-8 text-left transition-transform active:scale-[0.96] ambient-float border border-white/40"
              >
                <div className="flex flex-col h-full justify-between gap-6">
                  <div className="w-20 h-20 bg-surface-container-lowest rounded-full flex items-center justify-center pillow-shadow">
                    <span className="material-symbols-outlined text-secondary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                  </div>
                  <div>
                    <h3 className="font-headline text-3xl text-on-secondary-container mb-2 font-extrabold">Ler Receita Médica</h3>
                    <p className="text-on-secondary-container/80 text-lg leading-snug font-medium">Não entende a letra do médico? Eu leio para você!</p>
                  </div>
                </div>
              </button>
            </section>

            {/* Dica Card */}
            <section className="bg-surface-container-low rounded-xl p-8 relative overflow-hidden border border-white shadow-sm">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="organic-blob w-24 h-24 bg-tertiary-container flex-shrink-0 flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-on-tertiary-container text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                </div>
                <div className="space-y-2">
                  <h4 className="font-headline text-xl font-bold text-tertiary">Dica da Vovó</h4>
                  <p className="text-on-surface text-xl leading-relaxed italic font-medium">
                    "Lembre-se de beber um copinho d'água agora, meu bem. Hidratação é saúde!"
                  </p>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary-fixed opacity-20 rounded-full -mr-16 -mt-16"></div>
            </section>

            {/* Next Med Card */}
            <div 
              onClick={() => setAppState('AVISO')}
              className="bg-surface-container-high rounded-full p-6 flex items-center justify-between ambient-float border border-white cursor-pointer active:scale-95 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center pillow-shadow">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
                </div>
                <span className="font-bold text-lg text-on-surface">Seu próximo remédio é às 15:00</span>
              </div>
              <span className="material-symbols-outlined text-primary">chevron_right</span>
            </div>

            {/* Emergency Button */}
            <Button
              onClick={() => setShowEmergencyDialog(true)}
              className="h-20 rounded-xl bg-error hover:bg-red-700 text-white flex items-center justify-center gap-4 shadow-xl w-full border-b-4 border-black/10 active:border-b-0 transition-all"
            >
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
              <span className="text-xl font-extrabold uppercase tracking-tight">Chamar Ambulância</span>
            </Button>
          </>
        )}

        {appState === 'RECEITAS' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
               <button onClick={() => setAppState('INICIO')} className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-colors">
                 <span className="material-symbols-outlined text-primary text-2xl">arrow_back</span>
               </button>
               <h2 className="font-headline text-3xl font-extrabold text-on-background tracking-tight">Minhas Receitas</h2>
            </div>
            
            <div className="space-y-4">
              {isHistoryLoading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <p className="text-xl font-bold text-primary">Lembrando...</p>
                </div>
              ) : scansHistory && scansHistory.length > 0 ? (
                scansHistory.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleOpenHistoryItem(item)}
                    className="bg-white rounded-xl p-6 flex items-center justify-between cursor-pointer hover:bg-primary-container/10 transition-all soft-float border border-white"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-inner">
                        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                      </div>
                      <div>
                        <h4 className="font-headline font-bold text-xl text-on-background">{item.medicineName}</h4>
                        <p className="text-sm text-muted-foreground font-medium">{new Date(item.scanDateTime).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-primary/30">chevron_right</span>
                  </div>
                ))
              ) : (
                <div className="bg-surface-container-low rounded-xl p-12 text-center space-y-4 border-2 border-dashed border-outline/10">
                  <span className="material-symbols-outlined text-6xl text-primary/20 mx-auto" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
                  <p className="text-xl text-muted-foreground font-bold">Sua caixinha de lembranças está vazia!</p>
                  <Button onClick={() => setAppState('INICIO')} variant="outline" className="rounded-full px-8">Começar Agora</Button>
                </div>
              )}
            </div>
          </div>
        )}

        {appState === 'CONTA' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
               <button onClick={() => setAppState('INICIO')} className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-colors">
                 <span className="material-symbols-outlined text-primary text-2xl">arrow_back</span>
               </button>
               <h2 className="font-headline text-3xl font-extrabold text-on-background tracking-tight">Minha Conta</h2>
            </div>

            <div className="bg-white p-8 rounded-xl space-y-8 soft-float border border-white">
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-secondary-container overflow-hidden border-4 border-white shadow-lg">
                   {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>face_6</span>}
                </div>
                <div className="text-center">
                   <h3 className="font-headline text-2xl font-bold">{user.displayName}</h3>
                   <p className="text-muted-foreground font-medium">{user.email}</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-outline/5">
                <Button 
                  onClick={handleSignOut}
                  variant="outline" 
                  className="w-full h-16 rounded-full border-2 border-error/20 text-error font-bold text-lg hover:bg-error/5"
                >
                  <span className="material-symbols-outlined mr-2">logout</span> Sair do Aplicativo
                </Button>
              </div>
            </div>
          </div>
        )}

        {appState === 'AVISO' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
               <button onClick={() => setAppState('INICIO')} className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-colors">
                 <span className="material-symbols-outlined text-primary text-2xl">arrow_back</span>
               </button>
               <h2 className="font-headline text-3xl font-extrabold text-on-background tracking-tight">Horários</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-xl flex items-center justify-between border-l-8 border-primary soft-float border border-white">
                <div>
                  <span className="bg-primary text-white font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">Às 08:00</span>
                  <h4 className="text-2xl font-extrabold text-on-background mt-2">Remédio de Pressão</h4>
                  <p className="text-on-surface-variant font-bold">1 comprimido em jejum</p>
                </div>
                <div className="w-14 h-14 bg-surface-container rounded-full flex items-center justify-center pillow-shadow text-primary">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {appState === 'CAPTURING' && (
          <div className="fixed inset-0 z-[100] bg-black">
            <CameraCapture 
              onCapture={handlePhotoCaptured} 
              onCancel={() => setAppState('INICIO')} 
              onFileSelect={handleFileClick}
            />
          </div>
        )}

        {appState === 'PROCESSING' && (
          <div className="w-full flex flex-col items-center py-10 animate-fade-in">
            <LoadingState 
              message={appMode === 'MEDICINE' ? "Lendo seu remédio..." : "Lendo sua receita..."} 
            />
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
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/10 px-8 py-3 pb-8 flex justify-around items-center z-50">
        <button 
          onClick={() => setAppState('INICIO')}
          className="flex flex-col items-center gap-1 group transition-all"
        >
          <div className={cn("px-5 py-1 rounded-full transition-all", appState === 'INICIO' ? "bg-primary-container text-on-primary-container shadow-sm" : "hover:bg-surface-container text-on-surface-variant")}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: appState === 'INICIO' ? "'FILL' 1" : "'FILL' 0" }}>home</span>
          </div>
          <span className="text-[10px] font-bold text-on-surface-variant">Início</span>
        </button>

        <button 
          onClick={() => handleStartCapture('MEDICINE')}
          className="flex flex-col items-center gap-1 group transition-all"
        >
          <div className={cn("px-5 py-1 rounded-full transition-all", appState === 'CAPTURING' && appMode === 'MEDICINE' ? "bg-primary-container text-on-primary-container shadow-sm" : "hover:bg-surface-container text-on-surface-variant")}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: appState === 'CAPTURING' && appMode === 'MEDICINE' ? "'FILL' 1" : "'FILL' 0" }}>medication</span>
          </div>
          <span className="text-[10px] font-bold text-on-surface-variant">Remédios</span>
        </button>
        
        <button 
          onClick={() => setAppState('RECEITAS')}
          className="flex flex-col items-center gap-1 group transition-all"
        >
          <div className={cn("px-5 py-1 rounded-full transition-all", appState === 'RECEITAS' ? "bg-primary-container text-on-primary-container shadow-sm" : "hover:bg-surface-container text-on-surface-variant")}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: appState === 'RECEITAS' ? "'FILL' 1" : "'FILL' 0" }}>description</span>
          </div>
          <span className="text-[10px] font-bold text-on-surface-variant">Receitas</span>
        </button>

        <button 
          onClick={() => setAppState('CONTA')}
          className="flex flex-col items-center gap-1 group transition-all"
        >
          <div className={cn("px-5 py-1 rounded-full transition-all", appState === 'CONTA' ? "bg-primary-container text-on-primary-container shadow-sm" : "hover:bg-surface-container text-on-surface-variant")}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: appState === 'CONTA' ? "'FILL' 1" : "'FILL' 0" }}>account_circle</span>
          </div>
          <span className="text-[10px] font-bold text-on-surface-variant">Conta</span>
        </button>

        <button 
          onClick={() => setAppState('AVISO')}
          className="flex flex-col items-center gap-1 group transition-all"
        >
          <div className={cn("px-5 py-1 rounded-full transition-all relative", appState === 'AVISO' ? "bg-primary-container text-on-primary-container shadow-sm" : "hover:bg-surface-container text-on-surface-variant")}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: appState === 'AVISO' ? "'FILL' 1" : "'FILL' 0" }}>notifications_active</span>
            <div className="absolute top-1 right-4 w-2 h-2 bg-error rounded-full border border-white"></div>
          </div>
          <span className="text-[10px] font-bold text-on-surface-variant">Aviso</span>
        </button>
      </nav>

      {/* Emergency Dialog */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent className="max-w-sm rounded-xl p-8 text-center space-y-6 bg-surface border-none shadow-2xl">
          <div className="bg-error-container w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-5xl text-error" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
          </div>
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl font-extrabold text-error">Chamar o SAMU?</DialogTitle>
            <DialogDescription className="text-lg font-bold mt-2 text-on-surface leading-tight">
              Vovó, a senhora precisa de ajuda urgente? 
              Vou ligar para o 192 agora mesmo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-3 sm:flex-col">
            <Button 
              className="h-16 w-full rounded-full bg-error text-white text-xl font-bold shadow-lg active:translate-y-1 transition-all"
              onClick={() => {
                window.location.href = 'tel:192';
                setShowEmergencyDialog(false);
              }}
            >
              Ligar Agora (192)
            </Button>
            <Button 
              variant="outline" 
              className="h-12 w-full rounded-full border-2 border-outline/20 text-on-surface-variant font-bold"
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
