
"use client"

import React, { useState } from 'react';
import { Volume2, Loader2, Heart, MapPin, MessageCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import type { ReadPrescriptionOutput } from '@/ai/flows/read-prescription-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';

const KawaiiDoc = () => (
  <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 4H20L26 10V28C26 29.1046 25.1046 30 24 30H6C4.89543 30 4 29.1046 4 28V6C4 4.89543 4.89543 4 6 4Z" fill="#f5edde" stroke="#1e1b13" strokeWidth="2"/>
    <path d="M10 12H22" stroke="#1e1b13" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10 18H22" stroke="#1e1b13" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="13" cy="24" r="1" fill="#1e1b13"/>
    <circle cx="19" cy="24" r="1" fill="#1e1b13"/>
    <path d="M14 26C14.5 27 17.5 27 18 26" stroke="#1e1b13" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

interface PrescriptionResultProps {
  data: ReadPrescriptionOutput;
  onReset: () => void;
}

export function PrescriptionResult({ data, onReset }: PrescriptionResultProps) {
  const [loadingAudioIdx, setLoadingAudioIdx] = useState<number | null>(null);

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
      <header className="text-center space-y-3 py-6">
        <span className="inline-block px-4 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs uppercase tracking-widest border-2 border-[#1e1b13]">
          Inteligência da Vovó
        </span>
        <h2 className="font-headline font-extrabold text-4xl text-on-background tracking-tight">Sua Receitinha</h2>
        <p className="text-on-surface-variant font-medium px-4">
          A IA da Vovó leu a foto e encontrou esses remédios para você:
        </p>
      </header>

      {/* Medicines Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.medicines.map((med, idx) => (
          <div key={idx} className="bg-surface-container-low p-6 rounded-xl border-2 border-[#1e1b13] shadow-[6px_6px_0px_#1e1b13] space-y-4 relative group">
            <div className="relative">
              <div className={`w-24 h-24 organic-blob-1 flex items-center justify-center mx-auto border-2 border-[#1e1b13] ${idx % 2 === 0 ? 'bg-primary-container/30' : 'bg-tertiary-container/30'}`}>
                <KawaiiDoc />
              </div>
              <button 
                onClick={() => handlePlayAudio(idx, med.name, med.longInstruction)}
                className="absolute top-0 right-0 p-2 rounded-full bg-white shadow-md text-primary hover:scale-110 transition-transform border-2 border-[#1e1b13]"
              >
                {loadingAudioIdx === idx ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>volume_up</span>}
              </button>
            </div>
            <div className="text-center space-y-1">
              <h3 className={`font-headline font-bold text-2xl ${idx % 2 === 0 ? 'text-primary' : 'text-tertiary'}`}>{med.name}</h3>
              <p className={`font-medium text-sm px-4 py-1.5 rounded-full inline-block italic border-2 border-[#1e1b13] ${idx % 2 === 0 ? 'bg-secondary-container/50 text-secondary' : 'bg-tertiary-fixed text-tertiary'}`}>
                {med.shortPurpose}
              </p>
            </div>
            <div className="pillow-shadow bg-surface-container-highest p-5 rounded-lg text-sm leading-relaxed text-on-surface-variant font-medium border border-[#1e1b13]/10">
              {med.longInstruction}
            </div>
          </div>
        ))}
      </section>

      {/* Pharmacy Section */}
      <section className="space-y-6 pt-4">
        <div className="space-y-1 px-2">
          <h2 className="font-headline font-bold text-2xl text-on-background">Farmácias Perto de Você</h2>
          <p className="text-on-surface-variant text-sm flex items-center gap-1 font-medium">
            <MapPin className="w-4 h-4 text-primary" />
            Detectamos sua localização em {data.city || 'sua região'}
          </p>
        </div>

        {/* Fake Map View */}
        <div className="relative h-48 rounded-xl overflow-hidden border-2 border-[#1e1b13] shadow-[4px_4px_0px_#1e1b13]">
          <Image 
            src="https://picsum.photos/seed/map/600/400" 
            alt="Mapa" 
            fill 
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
        </div>

        {/* Pharmacy List */}
        <div className="space-y-4">
          {data.pharmacies.map((pharm, i) => (
            <div key={i} className="flex items-center gap-4 bg-surface-container p-4 rounded-lg border-2 border-[#1e1b13] shadow-[4px_4px_0px_#1e1b13]">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm border-2 border-[#1e1b13]">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_pharmacy</span>
              </div>
              <div className="flex-grow">
                <h4 className="font-bold text-on-surface text-lg">{pharm.name}</h4>
                <p className="text-xs text-on-surface-variant font-medium">{pharm.distance} • {pharm.status}</p>
              </div>
              <Button
                asChild
                className="bg-[#25D366] hover:bg-[#128C7E] text-white px-4 h-11 rounded-full flex items-center gap-2 shadow-sm border-2 border-[#1e1b13]"
              >
                <a href={`https://wa.me/${pharm.whatsapp}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-bold text-xs">WhatsApp</span>
                </a>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Final Message */}
      <div className="bg-primary-container/20 p-8 rounded-xl text-center space-y-4 border-2 border-dashed border-[#1e1b13]/20">
        <Heart className="w-12 h-12 text-primary fill-primary mx-auto" />
        <p className="font-headline font-bold text-primary italic text-lg">
          "Não esqueça de tomar uma aguinha também, viu, meu anjo?"
        </p>
      </div>

      <Button
        onClick={onReset}
        className="w-full h-16 text-xl font-bold rounded-full bg-primary text-white shadow-[6px_6px_0px_#1e1b13] border-2 border-[#1e1b13] flex items-center justify-center gap-3 active:translate-y-1 transition-all"
      >
        <RefreshCcw className="w-6 h-6" />
        Voltar ao Início
      </Button>
    </div>
  );
}
