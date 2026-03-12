
"use client"

import React, { useState } from 'react';
import { Heart, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { Input } from '@/components/ui/label'; // Actually using standard HTML input for simplicity here or our Input component

const KawaiiMedicine = () => (
  <svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="10" width="16" height="18" rx="4" fill="#a7c7e7" stroke="#1e1b13" strokeWidth="2.5"/>
    <rect x="6" y="4" width="20" height="6" rx="2" fill="#eab9a4" stroke="#1e1b13" strokeWidth="2.5"/>
    <circle cx="13" cy="18" r="1.5" fill="#1e1b13"/>
    <circle cx="19" cy="18" r="1.5" fill="#1e1b13"/>
    <path d="M14 21C14.5 22 17.5 22 18 21" stroke="#1e1b13" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

interface MedicineResultProps {
  medicineName: string;
  explanation: string;
  onReset: () => void;
  onSaveToActive: (name: string, schedule: string, purpose: string) => void;
}

export function MedicineResult({ medicineName, explanation, onReset, onSaveToActive }: MedicineResultProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [schedule, setSchedule] = useState('');

  const handlePlayAudio = async () => {
    setIsPlaying(true);
    try {
      const textToRead = `O remédio é ${medicineName}. Para que serve? ${explanation}`;
      const result = await textToSpeech(textToRead);
      new Audio(result.media).play();
    } catch (error) {
      console.error("TTS error:", error);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex flex-col space-y-8 animate-fade-in w-full">
      <header className="text-center space-y-3 py-4">
        <span className="inline-block px-4 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs border-[2px] border-[#1e1b13]">INTELIGÊNCIA DA VOVÓ</span>
        <h2 className="font-headline font-extrabold text-4xl text-on-background tracking-tight">O que eu vi:</h2>
      </header>

      <div className="bg-surface-container-low p-6 rounded-xl border-[3px] border-[#1e1b13] shadow-[8px_8px_0px_#1e1b13] space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-28 h-28 organic-blob-1 bg-primary-container/30 flex items-center justify-center mx-auto border-[2px] border-[#1e1b13]">
            <KawaiiMedicine />
          </div>
          <div className="space-y-1">
            <h3 className="text-4xl font-extrabold text-primary tracking-tight">{medicineName}</h3>
            <span className="text-secondary font-bold text-lg px-6 py-1 bg-secondary-container/50 rounded-full inline-block italic border-[2px] border-[#1e1b13]">
              Lido com carinho!
            </span>
          </div>
        </div>

        <Button 
          onClick={handlePlayAudio}
          disabled={isPlaying}
          className="w-full h-16 flex items-center justify-center gap-3 rounded-full text-xl font-bold bg-primary text-white shadow-[4px_4px_0px_#1e1b13] border-[2px] border-[#1e1b13] active:translate-y-1 transition-all"
        >
          {isPlaying ? <Loader2 className="animate-spin" /> : <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>volume_up</span>}
          <span>Ouvir Explicação</span>
        </Button>

        <div className="pillow-shadow bg-surface-container-highest p-6 rounded-xl space-y-4 border-[2px] border-[#1e1b13]">
          <div className="flex items-center gap-2">
             <Heart className="w-6 h-6 text-primary fill-primary" />
             <h4 className="text-xl font-bold text-primary">Para que serve:</h4>
          </div>
          <p className="text-xl text-on-surface-variant leading-relaxed font-medium italic">
            {explanation}
          </p>
        </div>

        {!isAsking ? (
          <div className="bg-tertiary-fixed/30 p-6 rounded-xl border-[3px] border-[#1e1b13] space-y-4">
            <h4 className="text-center font-bold text-xl text-on-tertiary-fixed">Vovó, a senhora toma esse remédio?</h4>
            <div className="flex gap-4">
              <Button onClick={() => setIsAsking(true)} className="flex-1 h-14 rounded-xl bg-secondary text-white font-bold border-[2px] border-[#1e1b13] shadow-[4px_4px_0px_#1e1b13]">Sim, eu tomo</Button>
              <Button onClick={onReset} variant="outline" className="flex-1 h-14 rounded-xl border-[2px] border-[#1e1b13] font-bold">Não</Button>
            </div>
          </div>
        ) : (
          <div className="bg-primary-container/20 p-6 rounded-xl border-[3px] border-[#1e1b13] space-y-4 animate-fade-in">
             <h4 className="font-bold text-xl text-primary text-center">De quantas em quantas horas ou qual o horário?</h4>
             <input 
               type="text" 
               placeholder="Ex: de 8 em 8 horas ou 08:00"
               value={schedule}
               onChange={(e) => setSchedule(e.target.value)}
               className="w-full h-14 px-4 rounded-xl border-[3px] border-[#1e1b13] shadow-inner font-bold text-lg outline-none"
               autoFocus
             />
             <Button 
               disabled={!schedule}
               onClick={() => onSaveToActive(medicineName, schedule, explanation.substring(0, 50) + "...")}
               className="w-full h-14 rounded-xl bg-primary text-white font-bold border-[2px] border-[#1e1b13] shadow-[4px_4px_0px_#1e1b13]"
             >
               Salvar nos meus Remédios
             </Button>
          </div>
        )}
      </div>

      <Button
        onClick={onReset}
        className="w-full h-20 text-xl font-bold rounded-full shadow-[6px_6px_0px_#1e1b13] bg-surface-container-high text-primary flex items-center justify-center gap-3 border-[2px] border-[#1e1b13] active:translate-y-1 transition-all"
      >
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_back</span>
        Voltar para o Início
      </Button>
    </div>
  );
}
