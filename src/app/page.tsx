
"use client"

import React, { useState, useRef } from 'react';
import { Chrome, Loader2, ChevronRight, ArrowLeft } from 'lucide-react';
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
type AppState = 'INICIO' | 'CAPTURING' | 'PROCESSING' | 'RESULT' | 'RECEITAS' | 'REMEDIOS' | 'AVISO' | 'CONTA';

// Ícones Kawaii com contorno e carinhas
const KawaiiHome = ({ active }: { active?: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-all">
    <path d="M4 14L16 4L28 14V26C28 27.1046 27.1046 28 26 28H6C4.89543 28 4 27.1046 4 26V14Z" fill={active ? "#a7c7e7" : "#f5edde"} stroke="#1e1b13" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="12" y="18" width="8" height="10" fill="white" stroke="#1e1b13" strokeWidth="2"/>
    <circle cx="11" cy="12" r="1.5" fill="#1e1b13"/>
    <circle cx="21" cy="12" r="1.5" fill="#1e1b13"/>
    <path d="M14 14.5C14.5 15.5 17.5 15.5 18 14.5" stroke="#1e1b13" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const KawaiiMedicine = ({ active }: { active?: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-all">
    <rect x="8" y="10" width="16" height="18" rx="4" fill={active ? "#a7c7e7" : "#f5edde"} stroke="#1e1b13" strokeWidth="2.5"/>
    <rect x="6" y="4" width="20" height="6" rx="2" fill="#eab9a4" stroke="#1e1b13" strokeWidth="2.5"/>
    <circle cx="13" cy="18" r="1" fill="#1e1b13"/>
    <circle cx="19" cy="18" r="1" fill="#1e1b13"/>
    <path d="M14 21C14.5 22 17.5 22 18 21" stroke="#1e1b13" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const KawaiiPrescription = ({ active }: { active?: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-all">
    <path d="M6 4H20L26 10V28C26 29.1046 25.1046 30 24 30H6C4.89543 30 4 29.1046 4 28V6C4 4.89543 4.89543 4 6 4Z" fill={active ? "#c9ead9" : "#f5edde"} stroke="#1e1b13" strokeWidth="2.5"/>
    <path d="M11 12H21" stroke="#1e1b13" strokeWidth="2" strokeLinecap="round"/>
    <path d="M11 18H21" stroke="#1e1b13" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="13" cy="24" r="1" fill="#1e1b13"/>
    <circle cx="19" cy="24" r="1" fill="#1e1b13"/>
    <path d="M14 26C14.5 27 17.5 27 18 26" stroke="#1e1b13" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const KawaiiAccount = ({ active }: { active?: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-all">
    <circle cx="16" cy="16" r="12" fill={active ? "#edbca6" : "#f5edde"} stroke="#1e1b13" strokeWidth="2.5"/>
    <circle cx="16" cy="12" r="5" fill="white" stroke="#1e1b13" strokeWidth="2"/>
    <path d="M6 26C6 22 10 20 16 20C22 20 26 22 26 26" stroke="#1e1b13" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const KawaiiAviso = ({ active }: { active?: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-all">
    <path d="M16 4C10 4 8 8 8 14V22H24V14C24 8 22 4 16 4Z" fill={active ? "#ffdbcc" : "#f5edde"} stroke="#1e1b13" strokeWidth="2.5"/>
    <rect x="6" y="22" width="20" height="4" rx="2" fill="#c6e7d6" stroke="#1e1b13" strokeWidth="2.5"/>
    <circle cx="16" cy="28" r="2" fill="#1e1b13"/>
    <circle cx="13" cy="12" r="1" fill="#1e1b13"/>
    <circle cx="19" cy="12" r="1" fill="#1e1b13"/>
    <path d="M14 15C14.5 16 17.5 16 18 15" stroke="#1e1b13" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

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
  const [userLocation, setUserLocation] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firestore Queries
  const activeMedsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'active_medicines'),
      orderBy('addedAt', 'desc')
    );
  }, [db, user]);

  const historyQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'medicine_scans'),
      orderBy('scanDateTime', 'desc')
    );
  }, [db, user]);

  const { data: activeMedicines, isLoading: isActiveLoading } = useCollection(activeMedsQuery);
  const { data: historyItems, isLoading: isHistoryLoading } = useCollection(historyQuery);

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
        description: "Tivemos um problema com o login do Google. Ative o Google no Console do Firebase!" 
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setAppState('INICIO');
  };

  const handleStartCapture = (mode: AppMode) => {
    setAppMode(mode);
    if (mode === 'PRESCRIPTION') {
      // Tentar capturar localização antes
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserLocation(`${pos.coords.latitude}, ${pos.coords.longitude}`),
          () => console.log("Localização não permitida")
        );
      }
    }
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
        const output = await readPrescription({ photoDataUri, userLocation });
        setPrescriptionResult(output);
        if (user) {
          addDocumentNonBlocking(collection(db, 'users', user.uid, 'medicine_scans'), {
            userId: user.uid,
            scannedImageUrl: photoDataUri,
            medicineName: `Receita: ${output.medicines.map(m => m.name).join(', ')}`,
            simplifiedExplanation: `Receita com ${output.medicines.length} itens.`,
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
        description: "Houve um probleminha ao ler a foto.",
      });
      setAppState('INICIO');
    }
  };

  const handleSaveToActive = (name: string, schedule: string, purpose: string) => {
    if (!user) return;
    addDocumentNonBlocking(collection(db, 'users', user.uid, 'active_medicines'), {
      name,
      schedule,
      purpose,
      addedAt: new Date().toISOString()
    });
    setAppState('REMEDIOS');
    toast({ title: "Remédio guardado!", description: "Já coloquei ele na sua lista de remédios, vovó." });
  };

  const handleFileClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handlePhotoCaptured(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (isUserLoading) return <LoadingState message="Organizando seu cantinho..." />;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-12 animate-fade-in">
        <div className="w-32 h-32 organic-blob bg-secondary-container flex items-center justify-center shadow-xl border-[3px] border-[#1e1b13]">
          <KawaiiHome active />
        </div>
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight">Seu Remédio Vovó</h1>
          <p className="text-xl text-on-surface-variant font-medium">Um abraço de cuidado em cada remédio.</p>
        </div>
        <Button 
          onClick={handleGoogleSignIn}
          disabled={isLoggingIn}
          className="w-full max-w-xs h-16 rounded-xl bg-white text-on-surface border-[3px] border-[#1e1b13] flex items-center justify-center gap-3 text-lg font-bold shadow-[6px_6px_0px_#1e1b13] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_#1e1b13] transition-all"
        >
          {isLoggingIn ? <Loader2 className="animate-spin text-primary" /> : <Chrome className="text-primary" />}
          Entrar com Google
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background font-body text-on-background min-h-screen flex flex-col selection:bg-primary-container">
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b-[3px] border-[#1e1b13]/10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setAppState('CONTA')}
            className="w-12 h-12 rounded-full bg-secondary-container border-[3px] border-[#1e1b13] overflow-hidden transition-transform active:scale-90"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="Vovó" className="w-full h-full object-cover" />
            ) : (
              <KawaiiAccount active />
            )}
          </button>
          <h1 className="font-headline text-2xl font-extrabold text-primary tracking-tight">Oi, {user.displayName?.split(' ')[0] || 'Vovó'}!</h1>
        </div>
        <button className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center border-[2px] border-[#1e1b13]">
          <span className="material-symbols-outlined text-2xl">help_outline</span>
        </button>
      </header>

      <main className="flex-1 px-6 pt-8 pb-32 space-y-10 max-w-2xl mx-auto w-full animate-fade-in">
        
        {appState === 'INICIO' && (
          <>
            <section className="space-y-4">
              <div className="inline-block px-4 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-sm tracking-wider border-[2px] border-[#1e1b13]">
                BEM-VINDA AO SEU REMÉDIO VOVÓ
              </div>
              <h2 className="font-headline text-4xl leading-tight text-on-background font-extrabold">
                Olá, Vovó! Como você está hoje?
              </h2>
            </section>

            <section className="grid grid-cols-1 gap-6">
              <button 
                onClick={() => handleStartCapture('MEDICINE')}
                className="group relative w-full overflow-hidden bg-primary-container rounded-xl p-8 text-left border-[3px] border-[#1e1b13] shadow-[8px_8px_0px_#1e1b13] active:translate-y-1 active:shadow-[4px_4px_0px_#1e1b13] transition-all"
              >
                <div className="flex flex-col h-full justify-between gap-6">
                  <div className="w-20 h-20 bg-surface-container-lowest rounded-full flex items-center justify-center pillow-shadow border-[2px] border-[#1e1b13]">
                    <KawaiiMedicine active />
                  </div>
                  <div>
                    <h3 className="font-headline text-3xl text-on-primary-container mb-2 font-extrabold">Tirar Foto do Remédio</h3>
                    <p className="text-on-primary-container/80 text-lg leading-snug font-medium">Vou te ajudar a saber o que é e como tomar!</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => handleStartCapture('PRESCRIPTION')}
                className="group relative w-full overflow-hidden bg-secondary-container rounded-xl p-8 text-left border-[3px] border-[#1e1b13] shadow-[8px_8px_0px_#1e1b13] active:translate-y-1 active:shadow-[4px_4px_0px_#1e1b13] transition-all"
              >
                <div className="flex flex-col h-full justify-between gap-6">
                  <div className="w-20 h-20 bg-surface-container-lowest rounded-full flex items-center justify-center pillow-shadow border-[2px] border-[#1e1b13]">
                    <KawaiiPrescription active />
                  </div>
                  <div>
                    <h3 className="font-headline text-3xl text-on-secondary-container mb-2 font-extrabold">Ler Receita Médica</h3>
                    <p className="text-on-secondary-container/80 text-lg leading-snug font-medium">Não entende a letra do médico? Eu leio para você!</p>
                  </div>
                </div>
              </button>
            </section>

            <section className="bg-surface-container-low rounded-xl p-8 border-[3px] border-[#1e1b13] relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="organic-blob w-24 h-24 bg-tertiary-container border-[2px] border-[#1e1b13] flex-shrink-0 flex items-center justify-center">
                   <span className="material-symbols-outlined text-on-tertiary-container text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                </div>
                <div className="space-y-2">
                  <h4 className="font-headline text-xl text-tertiary font-bold">Dica do Netinho</h4>
                  <p className="text-on-surface text-xl leading-relaxed italic font-medium">
                    "Vovó, já tomou sua aguinha hoje? Eu te amo muito e quero te ver sempre bem!"
                  </p>
                </div>
              </div>
            </section>

            <div className="bg-surface-container-high rounded-full p-6 flex items-center justify-between border-[3px] border-[#1e1b13] shadow-[6px_6px_0px_#1e1b13]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center pillow-shadow border-[2px] border-[#1e1b13]">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
                </div>
                <span className="font-bold text-lg text-on-surface">Seu próximo remédio é às 15:00</span>
              </div>
              <ChevronRight className="text-primary" />
            </div>
            
            <Button
              onClick={() => setShowEmergencyDialog(true)}
              className="h-16 rounded-xl bg-error text-white text-xl font-extrabold uppercase border-[3px] border-[#1e1b13] shadow-[8px_8px_0px_#1e1b13] active:translate-y-1 active:shadow-[4px_4px_0px_#1e1b13] transition-all w-full"
            >
              <span className="material-symbols-outlined text-2xl mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
              Chamar SAMU
            </Button>
          </>
        )}

        {appState === 'REMEDIOS' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-headline text-4xl font-extrabold text-on-background">Meus Remédios</h2>
            <div className="space-y-4">
              {isActiveLoading ? (
                <div className="flex flex-col items-center py-10 gap-2"><Loader2 className="animate-spin text-primary" /><p className="font-bold">Lembrando...</p></div>
              ) : activeMedicines && activeMedicines.length > 0 ? (
                activeMedicines.map((med) => (
                  <div key={med.id} className="bg-white rounded-xl p-6 border-[3px] border-[#1e1b13] shadow-[6px_6px_0px_#1e1b13] flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-primary-container border-[2px] border-[#1e1b13] flex items-center justify-center">
                      <KawaiiMedicine active />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-headline font-extrabold text-2xl text-primary">{med.name}</h4>
                      <p className="text-on-surface-variant font-bold text-base bg-accent px-4 py-1.5 rounded-full border-[2px] border-[#1e1b13] inline-block mt-2">
                        {med.schedule}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-surface-container rounded-xl p-10 text-center border-[3px] border-dashed border-[#1e1b13]/20">
                  <KawaiiMedicine />
                  <p className="mt-4 font-bold text-xl text-muted-foreground">Vovó, sua lista de remédios está vazia!</p>
                  <Button onClick={() => setAppState('INICIO')} className="mt-6 rounded-full border-[3px] border-[#1e1b13] h-14 px-8 font-bold">Começar Agora</Button>
                </div>
              )}
            </div>
          </div>
        )}

        {appState === 'RECEITAS' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-headline text-4xl font-extrabold text-on-background">Minhas Receitas</h2>
            <div className="space-y-4">
              {isHistoryLoading ? (
                <Loader2 className="animate-spin mx-auto text-primary" />
              ) : historyItems && historyItems.length > 0 ? (
                historyItems.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      if (item.rawAiResponse) setPrescriptionResult(JSON.parse(item.rawAiResponse));
                      else setMedicineResult({ medicineName: item.medicineName, simpleExplanation: item.simplifiedExplanation });
                      setAppState('RESULT');
                    }}
                    className="bg-white rounded-xl p-6 border-[3px] border-[#1e1b13] shadow-[6px_6px_0px_#1e1b13] flex items-center justify-between cursor-pointer active:translate-y-1 active:shadow-[2px_2px_0px_#1e1b13]"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-full bg-secondary-container border-[2px] border-[#1e1b13] flex items-center justify-center">
                        <KawaiiPrescription active />
                      </div>
                      <div>
                        <h4 className="font-bold text-xl">{item.medicineName}</h4>
                        <p className="text-base text-muted-foreground font-medium">{new Date(item.scanDateTime).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <ChevronRight className="text-primary" />
                  </div>
                ))
              ) : (
                <p className="text-center py-10 font-bold text-xl">Nenhuma receita salva ainda.</p>
              )}
            </div>
          </div>
        )}

        {appState === 'CONTA' && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="font-headline text-4xl font-extrabold text-on-background">Minha Conta</h2>
            <div className="bg-white p-10 rounded-xl border-[4px] border-[#1e1b13] shadow-[10px_10px_0px_#1e1b13] flex flex-col items-center gap-8">
              <div className="w-32 h-32 rounded-full border-[4px] border-[#1e1b13] overflow-hidden shadow-xl">
                <img src={user.photoURL || ''} className="w-full h-full object-cover" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-headline text-3xl font-extrabold">{user.displayName}</h3>
                <p className="text-xl text-muted-foreground font-medium">{user.email}</p>
              </div>
              <Button 
                onClick={handleSignOut} 
                className="w-full h-16 rounded-xl border-[3px] border-error text-error bg-transparent hover:bg-error/10 font-extrabold text-lg"
              >
                Sair do Aplicativo
              </Button>
            </div>
          </div>
        )}

        {appState === 'AVISO' && (
          <div className="space-y-6 animate-fade-in">
             <h2 className="font-headline text-4xl font-extrabold text-on-background">Avisos e Lembretes</h2>
             <div className="bg-white p-8 rounded-xl border-[3px] border-[#1e1b13] shadow-[8px_8px_0px_#1e1b13] flex items-center gap-6">
               <div className="w-16 h-16 rounded-full bg-accent border-[2px] border-[#1e1b13] flex items-center justify-center">
                 <KawaiiAviso active />
               </div>
               <div>
                 <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full border-[2px] border-[#1e1b13]">EM BREVE</span>
                 <p className="font-extrabold text-2xl mt-2">Beber 200ml de água</p>
               </div>
             </div>
          </div>
        )}

        {appState === 'CAPTURING' && (
          <div className="fixed inset-0 z-[100] bg-black">
            <CameraCapture onCapture={handlePhotoCaptured} onCancel={() => setAppState('INICIO')} onFileSelect={handleFileClick} />
          </div>
        )}

        {appState === 'PROCESSING' && <LoadingState message={appMode === 'MEDICINE' ? "Lendo o remédio..." : "Lendo a receita..."} />}

        {appState === 'RESULT' && (
          <div className="w-full">
            {medicineResult && (
              <MedicineResult 
                medicineName={medicineResult.medicineName} 
                explanation={medicineResult.simpleExplanation} 
                onReset={() => setAppState('INICIO')}
                onSaveToActive={handleSaveToActive}
              />
            )}
            {prescriptionResult && <PrescriptionResult data={prescriptionResult} onReset={() => setAppState('INICIO')} />}
          </div>
        )}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface-container-highest/95 backdrop-blur-xl border-t-[3px] border-[#1e1b13]/15 px-6 pb-8 pt-4 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <button onClick={() => setAppState('INICIO')} className="flex flex-col items-center gap-1 group">
            <div className={cn("w-16 h-10 rounded-full flex items-center justify-center transition-all", appState === 'INICIO' ? "bg-primary-container border-[2px] border-[#1e1b13]" : "hover:bg-surface-variant")}>
              <KawaiiHome active={appState === 'INICIO'} />
            </div>
            <span className={cn("text-xs font-bold", appState === 'INICIO' ? "text-primary" : "text-on-surface-variant")}>Início</span>
          </button>

          <button onClick={() => setAppState('REMEDIOS')} className="flex flex-col items-center gap-1 group">
            <div className={cn("w-16 h-10 rounded-full flex items-center justify-center transition-all", appState === 'REMEDIOS' ? "bg-primary-container border-[2px] border-[#1e1b13]" : "hover:bg-surface-variant")}>
              <KawaiiMedicine active={appState === 'REMEDIOS'} />
            </div>
            <span className={cn("text-xs font-bold", appState === 'REMEDIOS' ? "text-primary" : "text-on-surface-variant")}>Remédios</span>
          </button>

          <button onClick={() => setAppState('RECEITAS')} className="flex flex-col items-center gap-1 group">
            <div className={cn("w-16 h-10 rounded-full flex items-center justify-center transition-all", appState === 'RECEITAS' ? "bg-primary-container border-[2px] border-[#1e1b13]" : "hover:bg-surface-variant")}>
              <KawaiiPrescription active={appState === 'RECEITAS'} />
            </div>
            <span className={cn("text-xs font-bold", appState === 'RECEITAS' ? "text-primary" : "text-on-surface-variant")}>Receitas</span>
          </button>

          <button onClick={() => setAppState('CONTA')} className="flex flex-col items-center gap-1 group">
            <div className={cn("w-16 h-10 rounded-full flex items-center justify-center transition-all", appState === 'CONTA' ? "bg-primary-container border-[2px] border-[#1e1b13]" : "hover:bg-surface-variant")}>
              <KawaiiAccount active={appState === 'CONTA'} />
            </div>
            <span className={cn("text-xs font-bold", appState === 'CONTA' ? "text-primary" : "text-on-surface-variant")}>Conta</span>
          </button>

          <button onClick={() => setAppState('AVISO')} className="flex flex-col items-center gap-1 group">
            <div className={cn("w-16 h-10 rounded-full flex items-center justify-center transition-all", appState === 'AVISO' ? "bg-primary-container border-[2px] border-[#1e1b13]" : "hover:bg-surface-variant")}>
              <KawaiiAviso active={appState === 'AVISO'} />
            </div>
            <span className={cn("text-xs font-bold", appState === 'AVISO' ? "text-primary" : "text-on-surface-variant")}>Aviso</span>
          </button>
        </div>
      </nav>

      {/* Emergency Dialog */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent className="max-w-sm rounded-xl border-[4px] border-[#1e1b13] shadow-[10px_10px_0px_#1e1b13] bg-white p-8 space-y-6">
          <div className="w-20 h-20 bg-error/10 rounded-full border-[2px] border-error flex items-center justify-center mx-auto">
             <KawaiiAviso active />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-error">CHAMAR AJUDA?</h2>
            <p className="font-bold text-lg">Vovó, a senhora precisa que eu ligue para o SAMU (192) agora?</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={() => window.location.href = 'tel:192'} className="h-16 rounded-xl bg-error text-white font-bold text-xl border-[3px] border-[#1e1b13] shadow-[4px_4px_0px_#1e1b13]">Sim, ligar para 192</Button>
            <Button variant="outline" onClick={() => setShowEmergencyDialog(false)} className="rounded-full border-[2px] border-[#1e1b13] h-14">Não, estou bem</Button>
          </div>
        </DialogContent>
      </Dialog>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </div>
  );
}
