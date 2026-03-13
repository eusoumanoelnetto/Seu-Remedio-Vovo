
"use client"

import React, { useState } from 'react';
import { Heart, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { textToSpeech } from '@/ai/flows/tts-flow';

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
    <div className="flex flex-col space-y-10 animate-fade-in w-full pb-10">
      <header className="text-center space-y-4 py-4">
        <span className="inline-block px-6 py-2 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-extrabold text-xs border-[3px] border-[#1e1b13] shadow-[4px_4px_0px_#1e1b13]">INTELIGÊNCIA DO NETINHO</span>
        <h2 className="font-headline font-extrabold text-5xl text-on-background tracking-tight">O que eu vi:</h2>
      </header>

      <div className="bg-white p-10 rounded-[3rem] border-[4px] border-[#1e1b13] shadow-[12px_12px_0px_#1e1b13] space-y-10">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-32 h-32 organic-blob bg-primary-container/20 flex items-center justify-center mx-auto border-[3px] border-[#1e1b13] shadow-inner">
            <KawaiiMedicine />
          </div>
          <div className="space-y-2">
            <h3 className="text-5xl font-extrabold text-primary tracking-tight">{medicineName}</h3>
            <span className="text-secondary font-extrabold text-xl px-8 py-2 bg-secondary-container/40 rounded-full inline-block italic border-[2px] border-[#1e1b13]">
              Lido com amor!
            </span>
          </div>
        </div>

        <Button 
          onClick={handlePlayAudio}
          disabled={isPlaying}
          className="w-full h-20 flex items-center justify-center gap-4 rounded-full text-2xl font-extrabold bg-primary text-white shadow-[8px_8px_0px_#1e1b13] border-[3px] border-[#1e1b13] active:translate-y-2 active:shadow-none transition-all"
        >
          {isPlaying ? <Loader2 className="animate-spin w-8 h-8" /> : <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>volume_up</span>}
          <span>Ouvir o Netinho</span>
        </Button>

        <div className="pillow-shadow bg-surface-container-low p-8 rounded-[2rem] space-y-4 border-[2px] border-[#1e1b13]/10">
          <div className="flex items-center gap-3">
             <Heart className="w-8 h-8 text-primary fill-primary" />
             <h4 className="text-2xl font-extrabold text-primary uppercase tracking-tight">Para que serve:</h4>
          </div>
          <p className="text-2xl text-on-surface leading-relaxed font-bold italic">
            {explanation}
          </p>
        </div>

        {!isAsking ? (
          <div className="bg-tertiary-fixed/40 p-8 rounded-[2rem] border-[4px] border-[#1e1b13] shadow-[8px_8px_0px_#1e1b13] space-y-6">
            <h4 className="text-center font-extrabold text-2xl text-on-tertiary-fixed">Vovó, a senhora toma esse remédio?</h4>
            <div className="flex gap-6">
              <Button onClick={() => setIsAsking(true)} className="flex-1 h-16 rounded-2xl bg-secondary text-white font-extrabold text-xl border-[3px] border-[#1e1b13] shadow-[6px_6px_0px_#1e1b13] active:translate-y-1 active:shadow-none">Sim, eu tomo</Button>
              <Button onClick={onReset} variant="outline" className="flex-1 h-16 rounded-2xl border-[3px] border-[#1e1b13] font-extrabold text-xl shadow-[6px_6px_0px_#1e1b13] active:translate-y-1 active:shadow-none">Não</Button>
            </div>
          </div>
        ) : (
          <div className="bg-primary-container/20 p-8 rounded-[2.5rem] border-[4px] border-[#1e1b13] shadow-[10px_10px_0px_#1e1b13] space-y-6 animate-fade-in">
             <h4 className="font-extrabold text-2xl text-primary text-center">De quantas em quantas horas ou qual o horário?</h4>
             <input 
               type="text" 
               placeholder="Ex: 08:00 ou de 8 em 8 horas"
               value={schedule}
               onChange={(e) => setSchedule(e.target.value)}
               className="w-full h-16 px-6 rounded-2xl border-[4px] border-[#1e1b13] shadow-inner font-extrabold text-2xl outline-none bg-white focus:bg-primary-container/10 transition-colors"
               autoFocus
             />
             <Button 
               disabled={!schedule}
               onClick={() => onSaveToActive(medicineName, schedule, explanation.substring(0, 50) + "...")}
               className="w-full h-16 rounded-2xl bg-primary text-white font-extrabold text-2xl border-[3px] border-[#1e1b13] shadow-[8px_8px_0px_#1e1b13] active:translate-y-2 active:shadow-none"
             >
               Salvar na minha Lista
             </Button>
          </div>
        )}
      </div>

      <Button
        onClick={onReset}
        className="w-full h-20 text-2xl font-extrabold rounded-full shadow-[8px_8px_0px_#1e1b13] bg-surface-container-high text-primary flex items-center justify-center gap-4 border-[3px] border-[#1e1b13] active:translate-y-2 active:shadow-none transition-all"
      >
        <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_back</span>
        Voltar para o Início
      </Button>
    </div>
  );
}
