
"use client"

import React, { useState } from 'react';
import { Volume2, Loader2, Heart, MapPin, MessageCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import type { ReadPrescriptionOutput } from '@/ai/flows/read-prescription-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const KawaiiDoc = () => (
  <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 4H20L26 10V28C26 29.1046 25.1046 30 24 30H6C4.89543 30 4 29.1046 4 28V6C4 4.89543 4.89543 4 6 4Z" fill="#f5edde" stroke="#1e1b13" strokeWidth="2.5"/>
    <path d="M10 12H22" stroke="#1e1b13" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M10 18H22" stroke="#1e1b13" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="13" cy="24" r="1.5" fill="#1e1b13"/>
    <circle cx="19" cy="24" r="1.5" fill="#1e1b13"/>
    <path d="M14 26C14.5 27 17.5 27 18 26" stroke="#1e1b13" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

interface PrescriptionResultProps {
  data: ReadPrescriptionOutput;
  onReset: () => void;
}

export function PrescriptionResult({ data, onReset }: PrescriptionResultProps) {
  const [loadingAudioIdx, setLoadingAudioIdx] = useState<number | null>(null);
  const mapPlaceholder = PlaceHolderImages.find(img => img.id === 'map-placeholder');

  const handlePlayAudio = async (idx: number, name: string, instruction: string) => {
    setLoadingAudioIdx(idx);
    try {
      const textToRead = `Remédio: ${name}. Instrução: ${instruction}`;
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
    <div className="space-y-12 animate-fade-in pb-20">
      {/* Hero Section */}
      <header className="text-center space-y-4 py-6">
        <span className="inline-block px-6 py-2 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-extrabold text-xs uppercase tracking-widest border-[3px] border-[#1e1b13] shadow-[4px_4px_0px_#1e1b13]">
          INTELIGÊNCIA DA VOVÓ
        </span>
        <h2 className="font-headline font-extrabold text-5xl text-on-background tracking-tight">Sua Receitinha</h2>
        <p className="text-on-surface-variant font-bold text-xl px-4 italic">
          "A IA do Netinho leu tudinho e encontrou esses remédios para a senhora!"
        </p>
      </header>

      {/* Medicines Grid */}
      <section className="grid grid-cols-1 gap-8">
        {data.medicines.map((med, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2.5rem] border-[4px] border-[#1e1b13] shadow-[10px_10px_0px_#1e1b13] space-y-6 relative group transition-all">
            <div className="flex justify-between items-start">
              <div className={`w-24 h-24 organic-blob flex items-center justify-center border-[3px] border-[#1e1b13] shadow-inner ${idx % 2 === 0 ? 'bg-primary-container/40' : 'bg-secondary-container/40'}`}>
                <KawaiiDoc />
              </div>
              <button 
                onClick={() => handlePlayAudio(idx, med.name, med.longInstruction)}
                className="w-16 h-16 rounded-full bg-white border-[3px] border-[#1e1b13] shadow-[4px_4px_0px_#1e1b13] text-primary hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#1e1b13] transition-all flex items-center justify-center"
              >
                {loadingAudioIdx === idx ? <Loader2 className="w-8 h-8 animate-spin" /> : <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>volume_up</span>}
              </button>
            </div>
            
            <div className="space-y-2">
              <h3 className={`font-headline font-extrabold text-3xl ${idx % 2 === 0 ? 'text-primary' : 'text-secondary'}`}>{med.name}</h3>
              <p className={`font-bold text-base px-6 py-2 rounded-full inline-block border-[2px] border-[#1e1b13] ${idx % 2 === 0 ? 'bg-primary-container/20 text-on-primary-container' : 'bg-secondary-container/20 text-on-secondary-container'}`}>
                {med.shortPurpose}
              </p>
            </div>
            
            <div className="pillow-shadow bg-surface-container-low p-6 rounded-2xl text-lg leading-relaxed text-on-surface font-medium border-[2px] border-[#1e1b13]/10 italic">
              {med.longInstruction}
            </div>
          </div>
        ))}
      </section>

      {/* Pharmacy Section */}
      <section className="space-y-8 pt-4">
        <div className="space-y-2 px-2">
          <h2 className="font-headline font-extrabold text-3xl text-on-background">Farmácias Perto de Você</h2>
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border-[2px] border-[#1e1b13] w-fit">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="font-bold text-on-surface-variant">Vovó, achamos farmácias em {data.city || 'sua região'}!</span>
          </div>
        </div>

        {/* Fake Map View - Estilo Sticker solicitado pela vovó */}
        <div className="relative h-64 rounded-[3.5rem] overflow-hidden border-[5px] border-[#1e1b13] shadow-[12px_12px_0px_#1e1b13] ambient-float group">
          <Image 
            src={mapPlaceholder?.imageUrl || "https://picsum.photos/seed/map/600/400"} 
            alt="Mapa das Farmácias" 
            fill 
            data-ai-hint={mapPlaceholder?.imageHint || "city map"}
            className="object-cover opacity-90 transition-transform group-hover:scale-110 duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
          {/* Marcador central animado */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
             <div className="w-14 h-14 bg-error rounded-full border-[3px] border-[#1e1b13] flex items-center justify-center shadow-xl animate-bounce">
                <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
             </div>
          </div>
        </div>

        {/* Pharmacy List */}
        <div className="grid grid-cols-1 gap-6">
          {data.pharmacies.map((pharm, i) => (
            <div key={i} className="flex items-center gap-6 bg-white p-6 rounded-[2rem] border-[3px] border-[#1e1b13] shadow-[6px_6px_0px_#1e1b13]">
              <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0 pillow-shadow border-[2px] border-[#1e1b13]">
                <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_pharmacy</span>
              </div>
              <div className="flex-grow">
                <h4 className="font-extrabold text-on-surface text-xl">{pharm.name}</h4>
                <p className="text-sm text-on-surface-variant font-bold">{pharm.distance} • {pharm.status}</p>
              </div>
              <Button
                asChild
                className="bg-[#25D366] hover:bg-[#128C7E] text-white px-6 h-14 rounded-full flex items-center gap-2 border-[2px] border-[#1e1b13] shadow-[4px_4px_0px_#1e1b13] active:translate-y-1 active:shadow-none"
              >
                <a href={`https://wa.me/${pharm.whatsapp}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-6 h-6" />
                  <span className="font-extrabold text-sm">WhatsApp</span>
                </a>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Final Message */}
      <div className="bg-primary-container/20 p-10 rounded-[3rem] text-center space-y-4 border-[3px] border-dashed border-[#1e1b13]/30">
        <Heart className="w-16 h-16 text-primary fill-primary mx-auto animate-pulse" />
        <p className="font-headline font-extrabold text-primary italic text-2xl leading-relaxed">
          "Não esqueça de tomar uma aguinha também, viu, meu anjo? O netinho te ama!"
        </p>
      </div>

      <Button
        onClick={onReset}
        className="w-full h-20 text-2xl font-extrabold rounded-full bg-primary text-white shadow-[10px_10px_0px_#1e1b13] border-[3px] border-[#1e1b13] flex items-center justify-center gap-4 active:translate-y-2 active:shadow-none transition-all"
      >
        <RefreshCcw className="w-8 h-8" />
        Voltar ao Início
      </Button>
    </div>
  );
}
