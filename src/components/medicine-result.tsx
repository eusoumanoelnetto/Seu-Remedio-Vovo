
"use client"

import React, { useState } from 'react';
import { Pill, Volume2, RefreshCcw, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { textToSpeech } from '@/ai/flows/tts-flow';

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
    <div className="flex flex-col space-y-8 animate-fade-in w-full">
      <Card className="card-elegant overflow-hidden border-none">
        <CardContent className="p-8 sm:p-10 space-y-8">
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-primary/10 p-5 rounded-[2rem] border-4 border-white shadow-inner">
                <Pill className="w-14 h-14 text-primary" />
              </div>
              <h2 className="text-4xl font-bold text-foreground leading-tight px-4">
                {medicineName}
              </h2>
            </div>

            <button 
              onClick={handlePlayAudio}
              disabled={isPlaying}
              className="w-full flex items-center justify-center gap-3 py-4 bg-accent/50 rounded-2xl text-accent-foreground font-bold hover:bg-accent transition-colors disabled:opacity-50"
            >
              {isPlaying ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
              <span className="text-lg">Toque no alto-falante pra ouvir</span>
            </button>

            <div className="bg-primary/5 rounded-[2.5rem] p-8 space-y-4 border border-primary/10">
              <div className="flex items-center gap-3">
                <div className="bg-primary p-2 rounded-full">
                   <Heart className="w-5 h-5 text-white fill-white" />
                </div>
                <h3 className="text-2xl font-bold text-primary">Pra que serve:</h3>
              </div>
              <p className="text-2xl text-foreground/80 leading-relaxed font-medium">
                {explanation}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center pt-4 border-t border-accent">
            <p className="text-lg text-muted-foreground font-medium italic">
              Use sempre conforme a receita, vovó. ❤️
            </p>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={onReset}
        className="w-full h-24 text-2xl font-bold rounded-[3rem] shadow-xl btn-hover bg-secondary text-white flex items-center justify-center gap-4"
      >
        <RefreshCcw className="w-8 h-8" />
        Ver outro remédio
      </Button>
    </div>
  );
}
