"use client"

import React, { useState } from 'react';
import { Pill, Volume2, RefreshCcw, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { textToSpeech } from '@/ai/flows/tts-flow';
import Image from 'next/image';

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
        <span className="inline-block px-4 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs uppercase tracking-widest">
          Inteligência da Vovó
        </span>
        <h2 className="font-headline font-extrabold text-4xl text-on-background tracking-tight">O que é isso?</h2>
      </header>

      <div className="bg-surface-container-low p-8 sm:p-12 rounded-xl soft-float border border-white/40 space-y-10">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="w-32 h-32 organic-blob-1 bg-primary-container/30 flex items-center justify-center mx-auto shadow-sm border-4 border-white">
              <span className="material-symbols-outlined text-primary text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>medication</span>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-4xl font-extrabold text-primary tracking-tight">{medicineName}</h3>
            <span className="text-secondary font-medium text-lg px-6 py-2 bg-secondary-container/50 rounded-full inline-block italic border border-white">
              Identificado com sucesso!
            </span>
          </div>
        </div>

        <Button 
          onClick={handlePlayAudio}
          disabled={isPlaying}
          className="w-full h-20 flex items-center justify-center gap-4 rounded-full text-xl font-bold bg-primary text-white shadow-lg active:scale-95 transition-all"
        >
          {isPlaying ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>volume_up</span>
          )}
          <span>Ouvir a explicação</span>
        </Button>

        <div className="pillow-shadow bg-surface-container-highest p-8 rounded-2xl space-y-6 border border-white/40">
          <div className="flex items-center gap-3">
             <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
             <h4 className="text-2xl font-bold text-primary">Para que serve:</h4>
          </div>
          <p className="text-2xl text-on-surface-variant leading-relaxed font-medium">
            {explanation}
          </p>
        </div>

        <div className="bg-primary-container/10 p-6 rounded-xl text-center space-y-2 border-2 border-dashed border-primary/10">
          <p className="font-headline font-bold text-primary italic text-lg">
            "Sempre tome como o médico mandou, viu?"
          </p>
        </div>
      </div>

      <Button
        onClick={onReset}
        className="w-full h-24 text-2xl font-bold rounded-full shadow-2xl bg-secondary text-white flex items-center justify-center gap-5 border-b-8 border-black/10 active:border-b-0 transition-all"
      >
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>refresh</span>
        Ver outro remédio
      </Button>
    </div>
  );
}
