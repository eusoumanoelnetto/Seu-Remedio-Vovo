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
      {/* Selo de Confirmação Fofo */}
      <div className="absolute -top-6 -right-4 z-20 rotate-12 scale-110">
        <div className="bg-yellow-400 p-1 rounded-full border-4 border-white shadow-xl">
           <Image src="https://picsum.photos/seed/star/100/100" alt="Selo" width={60} height={60} className="rounded-full" data-ai-hint="gold star illustration" />
        </div>
      </div>

      <Card className="card-elegant overflow-hidden border-none relative z-10">
        <CardContent className="p-8 sm:p-12 space-y-10">
          <div className="space-y-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="bg-primary/10 p-8 rounded-[2.5rem] border-4 border-white shadow-inner relative z-10">
                  <Pill className="w-20 h-20 text-primary" />
                </div>
                <div className="absolute -bottom-2 -left-2 w-full h-full bg-primary/5 rounded-[2.5rem] -z-10" />
              </div>
              <h2 className="text-5xl font-bold text-foreground leading-tight px-4 drop-shadow-sm">
                {medicineName}
              </h2>
            </div>

            <Button 
              onClick={handlePlayAudio}
              disabled={isPlaying}
              variant="secondary"
              className="w-full h-20 flex items-center justify-center gap-4 rounded-[2rem] text-xl font-bold btn-hover bg-accent/80 text-primary border-2 border-primary/10"
            >
              {isPlaying ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <Volume2 className="w-8 h-8" />
              )}
              <span>Ouvir a explicação</span>
            </Button>

            <div className="bg-primary/5 rounded-[3rem] p-10 space-y-6 border-2 border-primary/10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Heart className="w-24 h-24 text-primary fill-primary" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-primary p-3 rounded-2xl shadow-md">
                   <Heart className="w-6 h-6 text-white fill-white" />
                </div>
                <h3 className="text-3xl font-bold text-primary">Pra que serve:</h3>
              </div>
              <p className="text-2xl text-foreground/90 leading-relaxed font-medium relative z-10">
                {explanation}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center pt-8 border-t-2 border-accent gap-3">
            <p className="text-xl text-primary/60 font-bold italic text-center">
              "Tudo certinho para o seu cuidado, vovó! ❤️"
            </p>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Lembre-se: Use como o médico mandou</p>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={onReset}
        className="w-full h-28 text-3xl font-bold rounded-[3.5rem] shadow-2xl btn-hover bg-secondary text-white flex items-center justify-center gap-5 border-b-8 border-secondary-foreground/10"
      >
        <RefreshCcw className="w-10 h-10" />
        Ver outro remédio
      </Button>
    </div>
  );
}
