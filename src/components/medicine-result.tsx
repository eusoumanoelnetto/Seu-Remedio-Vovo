
"use client"

import React, { useState } from 'react';
import { Pill, Volume2, RefreshCcw, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { textToSpeech } from '@/ai/flows/tts-flow';
import Image from 'next/image';

const KawaiiMedicine = () => (
  <svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="10" width="16" height="18" rx="4" fill="#a7c7e7" stroke="#1e1b13" strokeWidth="2"/>
    <rect x="6" y="4" width="20" height="6" rx="2" fill="#eab9a4" stroke="#1e1b13" strokeWidth="2"/>
    <circle cx="13" cy="18" r="1.5" fill="#1e1b13"/>
    <circle cx="19" cy="18" r="1.5" fill="#1e1b13"/>
    <path d="M14 21C14.5 22 17.5 22 18 21" stroke="#1e1b13" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

interface MedicineResultProps {
  medicineName: string;
  explanation: string;
  onReset: () => void;
}

export function MedicineResult({ medicineName, explanation, onReset }: MedicineResultProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handlePlayAudio = async () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
      return;
    }

    setIsPlaying(true);
    try {
      const textToRead = `O remédio é ${medicineName}. Para que serve? ${explanation}`;
      const result = await textToSpeech(textToRead);
      setAudioUrl(result.media);
      const audio = new Audio(result.media);
      audio.play();
    } catch (error) {
      console.error("TTS error:", error);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex flex-col space-y-8 animate-fade-in w-full relative">
      <header className="text-center space-y-3 py-6">
        <span className="inline-block px-4 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs uppercase tracking-widest border-2 border-[#1e1b13]">
          Inteligência da Vovó
        </span>
        <h2 className="font-headline font-extrabold text-4xl text-on-background tracking-tight">O que é isso?</h2>
      </header>

      <div className="bg-surface-container-low p-8 sm:p-12 rounded-xl border-2 border-[#1e1b13] shadow-[8px_8px_0px_#1e1b13] space-y-10">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-32 h-32 organic-blob-1 bg-primary-container/30 flex items-center justify-center mx-auto border-2 border-[#1e1b13]">
            <KawaiiMedicine />
          </div>
          <div className="space-y-2">
            <h3 className="text-4xl font-extrabold text-primary tracking-tight">{medicineName}</h3>
            <span className="text-secondary font-medium text-lg px-6 py-2 bg-secondary-container/50 rounded-full inline-block italic border-2 border-[#1e1b13]">
              Identificado com sucesso!
            </span>
          </div>
        </div>

        <Button 
          onClick={handlePlayAudio}
          disabled={isPlaying}
          className="w-full h-20 flex items-center justify-center gap-4 rounded-full text-xl font-bold bg-primary text-white shadow-[4px_4px_0px_#1e1b13] border-2 border-[#1e1b13] active:translate-y-1 transition-all"
        >
          {isPlaying ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>volume_up</span>
          )}
          <span>Ouvir a explicação</span>
        </Button>

        <div className="pillow-shadow bg-surface-container-highest p-8 rounded-2xl space-y-6 border-2 border-[#1e1b13]">
          <div className="flex items-center gap-3">
             <Heart className="w-8 h-8 text-primary fill-primary" />
             <h4 className="text-2xl font-bold text-primary">Para que serve:</h4>
          </div>
          <p className="text-2xl text-on-surface-variant leading-relaxed font-medium">
            {explanation}
          </p>
        </div>

        <div className="bg-primary-container/10 p-6 rounded-xl text-center space-y-2 border-2 border-dashed border-[#1e1b13]/20">
          <p className="font-headline font-bold text-primary italic text-lg">
            "Sempre tome como o médico mandou, viu?"
          </p>
        </div>
      </div>

      <Button
        onClick={onReset}
        className="w-full h-24 text-2xl font-bold rounded-full shadow-[8px_8px_0px_#1e1b13] bg-secondary text-white flex items-center justify-center gap-5 border-2 border-[#1e1b13] active:translate-y-1 transition-all"
      >
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>refresh</span>
        Ver outro remédio
      </Button>
    </div>
  );
}
