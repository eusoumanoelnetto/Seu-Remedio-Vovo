
"use client"

import React, { useState } from 'react';
import { FileText, MapPin, MessageCircle, RefreshCcw, Pill, Heart, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import type { ReadPrescriptionOutput } from '@/ai/flows/read-prescription-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';

interface PrescriptionResultProps {
  data: ReadPrescriptionOutput;
  onReset: () => void;
}

export function PrescriptionResult({ data, onReset }: PrescriptionResultProps) {
  const [loadingAudioIdx, setLoadingAudioIdx] = useState<number | null>(null);

  const handlePlayAudio = async (idx: number, name: string, purpose: string) => {
    setLoadingAudioIdx(idx);
    try {
      const textToRead = `Remédio: ${name}. ${purpose}`;
      const result = await textToSpeech(textToRead);
      const audio = new Audio(result.media);
      audio.play();
    } catch (error) {
      console.error("TTS error:", error);
    } finally {
      setLoadingAudioIdx(null);
    }
  };

  return (
    <div className="flex flex-col space-y-12 animate-fade-in w-full pb-10">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-secondary/10 mb-2 border-4 border-white shadow-xl">
          <FileText className="w-12 h-12 text-secondary" />
        </div>
        <div>
          <h2 className="text-4xl font-bold text-foreground">Receita Lida!</h2>
          <p className="text-xl text-muted-foreground font-medium">Encontrei {data.medicines.length} itens importantes:</p>
        </div>
      </div>

      {/* Medicamentos */}
      <div className="space-y-8">
        <div className="grid gap-8">
          {data.medicines.map((med, idx) => (
            <Card key={idx} className="card-elegant border-none overflow-hidden group">
              <CardContent className="p-0">
                <div className="relative h-56 w-full overflow-hidden">
                  <Image
                    src={`https://picsum.photos/seed/${med.imageSeed}/800/400`}
                    alt={med.name}
                    fill
                    className="object-cover"
                    data-ai-hint="medicine packaging"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-3xl font-bold text-primary break-words leading-tight">{med.name}</h4>
                    <button 
                      onClick={() => handlePlayAudio(idx, med.name, med.purpose)}
                      disabled={loadingAudioIdx !== null}
                      className="flex items-center gap-2 text-primary font-bold hover:underline disabled:opacity-50"
                    >
                      {loadingAudioIdx === idx ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                      <span>Ouvir explicação</span>
                    </button>
                  </div>

                  <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10">
                    <p className="text-xl text-foreground/80 leading-relaxed font-medium">
                      <span className="font-bold text-primary">Pra que serve: </span>
                      {med.purpose}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Farmácias */}
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-4">
          <div className="bg-secondary p-2 rounded-xl">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Onde comprar perto da senhora:</h3>
        </div>

        <div className="grid gap-6">
          {data.pharmacies.map((pharm, idx) => (
            <Card key={idx} className="card-elegant border-none bg-white/70">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="text-2xl font-bold text-foreground leading-tight">{pharm.name}</h4>
                    <span className="shrink-0 bg-secondary/10 text-secondary text-sm font-bold px-4 py-2 rounded-full border border-secondary/20">
                      {pharm.distance}
                    </span>
                  </div>
                  <p className="text-lg text-muted-foreground leading-snug font-medium">{pharm.address}</p>
                </div>
                
                <Button
                  asChild
                  className="w-full h-20 rounded-[2rem] bg-[#25D366] hover:bg-[#128C7E] text-white text-xl font-bold shadow-lg btn-hover border-b-4 border-[#128C7E]/30"
                >
                  <a 
                    href={`https://wa.me/55${pharm.whatsapp}?text=Olá,%20vi%20sua%20farmácia%20no%20Vovó%20Remédio%20e%20gostaria%20de%20saber%20o%20preço%20destes%20itens.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3"
                  >
                    <MessageCircle className="w-8 h-8" />
                    Falar no WhatsApp
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="pt-10 px-2 space-y-6">
        <div className="flex items-center justify-center text-primary/60 font-medium italic">
          <Heart className="w-6 h-6 mr-2 fill-primary/10" />
          <span>Qualquer dúvida, pergunte ao seu médico, vovó!</span>
        </div>
        <Button
          onClick={onReset}
          className="w-full h-20 text-2xl font-bold rounded-[2.5rem] shadow-xl btn-hover bg-primary text-white"
        >
          <RefreshCcw className="w-8 h-8 mr-2" />
          Voltar ao Início
        </Button>
      </div>
    </div>
  );
}
