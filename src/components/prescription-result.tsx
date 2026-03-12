"use client"

import React, { useState } from 'react';
import { FileText, MapPin, MessageCircle, RefreshCcw, Heart, Volume2, Loader2, Sparkles } from 'lucide-react';
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
    <div className="flex flex-col space-y-16 animate-fade-in w-full pb-20 relative">
      {/* Decoração Flutuante */}
      <div className="absolute -top-10 left-0 opacity-20 animate-bounce duration-[4000ms]">
        <Heart className="w-12 h-12 text-primary fill-primary" />
      </div>

      <div className="text-center space-y-6">
        <div className="relative inline-block">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-[3rem] bg-secondary/10 mb-4 border-4 border-white shadow-2xl relative z-10 overflow-hidden">
             <Image src="https://picsum.photos/seed/paper/200/200" alt="" fill className="object-cover opacity-20" data-ai-hint="old paper texture" />
             <FileText className="w-16 h-16 text-secondary relative z-20" />
          </div>
          <div className="absolute -top-4 -right-4 bg-yellow-400 p-2 rounded-full shadow-lg border-2 border-white rotate-12">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-5xl font-bold text-foreground drop-shadow-sm">Receita Lida!</h2>
          <p className="text-2xl text-primary font-bold mt-2">Encontrei {data.medicines.length} remédios para a senhora:</p>
        </div>
      </div>

      {/* Medicamentos */}
      <div className="space-y-10">
        <div className="grid gap-10">
          {data.medicines.map((med, idx) => (
            <Card key={idx} className="card-elegant border-none overflow-hidden group shadow-2xl hover:shadow-primary/5 transition-all">
              <CardContent className="p-0">
                <div className="relative h-64 w-full overflow-hidden">
                  <Image
                    src={`https://picsum.photos/seed/${med.imageSeed}/800/400`}
                    alt={med.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    data-ai-hint="medical box"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-8 flex items-center gap-3">
                     <div className="bg-white/90 p-2 rounded-xl shadow-lg backdrop-blur-sm">
                        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                     </div>
                     <span className="text-white font-bold text-xl drop-shadow-md">Remédio {idx + 1}</span>
                  </div>
                </div>
                <div className="p-10 space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-4xl font-bold text-primary break-words leading-tight border-l-8 border-primary pl-6">{med.name}</h4>
                    <Button 
                      onClick={() => handlePlayAudio(idx, med.name, med.purpose)}
                      disabled={loadingAudioIdx !== null}
                      variant="ghost"
                      className="flex items-center gap-3 text-primary font-bold text-xl hover:bg-primary/5 p-4 h-auto rounded-2xl border-2 border-primary/10"
                    >
                      {loadingAudioIdx === idx ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Volume2 className="w-6 h-6" />
                      )}
                      <span>Ouvir explicação</span>
                    </Button>
                  </div>

                  <div className="bg-primary/5 p-8 rounded-[3rem] border-2 border-primary/10 shadow-inner relative overflow-hidden">
                    <div className="absolute -bottom-4 -right-4 opacity-5">
                      <Sparkles className="w-32 h-32 text-primary" />
                    </div>
                    <p className="text-2xl text-foreground/90 leading-relaxed font-medium relative z-10">
                      <span className="font-bold text-primary block mb-2">Pra que serve?</span>
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
      <div className="space-y-10">
        <div className="flex flex-col items-center gap-4 px-4 text-center">
          <div className="bg-secondary p-4 rounded-[1.5rem] shadow-lg rotate-3">
            <MapPin className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-foreground">Onde encontrar pertinho da senhora:</h3>
        </div>

        <div className="grid gap-8">
          {data.pharmacies.map((pharm, idx) => (
            <Card key={idx} className="card-elegant border-none bg-white/80 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-secondary" />
              <CardContent className="p-10 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="text-3xl font-bold text-foreground leading-tight">{pharm.name}</h4>
                    <span className="shrink-0 bg-secondary/10 text-secondary text-lg font-bold px-6 py-2 rounded-full border-2 border-secondary/20 shadow-sm">
                      {pharm.distance}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-6 h-6 text-secondary shrink-0 mt-1" />
                    <p className="text-xl text-muted-foreground leading-snug font-medium">{pharm.address}</p>
                  </div>
                </div>
                
                <Button
                  asChild
                  className="w-full h-24 rounded-[3rem] bg-[#25D366] hover:bg-[#128C7E] text-white text-2xl font-bold shadow-2xl btn-hover border-b-8 border-[#128C7E]/40"
                >
                  <a 
                    href={`https://wa.me/55${pharm.whatsapp}?text=Olá,%20vi%20sua%20farmácia%20no%20Vovó%20Remédio%20e%20gostaria%20de%20saber%20o%20preço%20destes%20itens.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-4"
                  >
                    <MessageCircle className="w-10 h-10" />
                    Chamar no Zap
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="pt-16 px-4 space-y-10">
        <div className="flex flex-col items-center justify-center gap-4 text-primary/60 font-bold italic bg-primary/5 p-8 rounded-[3rem] border-2 border-dashed border-primary/20">
          <div className="flex items-center gap-2">
            <Heart className="w-8 h-8 fill-primary/20" />
            <span className="text-2xl">Cuidamos da senhora!</span>
          </div>
          <p className="text-lg text-center opacity-80">Qualquer dúvida, pergunte ao seu médico de confiança.</p>
        </div>
        <Button
          onClick={onReset}
          className="w-full h-28 text-3xl font-bold rounded-[3.5rem] shadow-2xl btn-hover bg-primary text-white border-b-8 border-primary-foreground/10"
        >
          <RefreshCcw className="w-10 h-10 mr-4" />
          Voltar ao Início
        </Button>
      </div>
    </div>
  );
}
