
"use client"

import React, { useState } from 'react';
import { Volume2, Loader2, Heart, MapPin, MessageCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import type { ReadPrescriptionOutput } from '@/ai/flows/read-prescription-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';

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
        <span className="inline-block px-4 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs uppercase tracking-widest">
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
          <div key={idx} className="bg-surface-container-low p-6 rounded-xl soft-float border border-white/40 space-y-4 relative group">
            <div className="relative">
              <div className={`w-24 h-24 organic-blob-1 flex items-center justify-center mx-auto ${idx % 2 === 0 ? 'bg-primary-container/30' : 'bg-tertiary-container/30'}`}>
                <Image 
                  src={idx % 2 === 0 ? "https://lh3.googleusercontent.com/aida-public/AB6AXuDnQo7Uy1BFtGzRHUsJNIVxMKQFBNK_Gp5pfC-79hCLn_bt_3YIQiBs1tqxQXphPv_he-_iFj463suO6ECxN9QRUcDshTAGVzcn8hwAVB8z2Rhi-Mw6NOjdIDTjdfWK5dr_PUeBYYu4tVD4JsVjbD1sfAkWfTT0iZY8UezbMC4HjEnWsV-IF_2M-VaBv1p0c4ve9NbQ7OUqAVPy3PzjqZr2NLzNmdGwYo7YEO7N9_-luvki_ixJpO5MAfyGwJmssXfK88PmM3IxBAM" : "https://lh3.googleusercontent.com/aida-public/AB6AXuADr_YDQtD_SRqGHi0nn_D5DGatLqRMeppeaMrt_8IIAUocDCMdcaugLgIYToj3dAcRsBUJbnd22QnyUyy_Q-WTIjEpmy0nIk0OzTWbFnk0-H4sXJ5KCPeU6vXoUJVujG3euS79DOm-nPkYYEkpGV4BwVxHFjBID4Tdd7H_-Q_EuSMxUE9t_LRPiIO6xdT-pLO3ZF7yfjYGuDR2Lvx6CNEZxGWzklGMfrYeBlWRN7Qt0BuQoiEmf5wH6gzX29aEcF13QFIV0l2IGic"}
                  alt="Medicine Box"
                  width={64}
                  height={64}
                  className="object-contain drop-shadow-md"
                />
              </div>
              <button 
                onClick={() => handlePlayAudio(idx, med.name, med.longInstruction)}
                className="absolute top-0 right-0 p-2 rounded-full bg-white shadow-md text-primary hover:scale-110 transition-transform"
              >
                {loadingAudioIdx === idx ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
            <div className="text-center space-y-1">
              <h3 className={`font-headline font-bold text-2xl ${idx % 2 === 0 ? 'text-primary' : 'text-tertiary'}`}>{med.name}</h3>
              <p className={`font-medium text-sm px-4 py-1.5 rounded-full inline-block italic ${idx % 2 === 0 ? 'bg-secondary-container/50 text-secondary' : 'bg-tertiary-fixed text-tertiary'}`}>
                {med.shortPurpose}
              </p>
            </div>
            <div className="pillow-shadow bg-surface-container-highest p-5 rounded-lg text-sm leading-relaxed text-on-surface-variant font-medium">
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
        <div className="relative h-48 rounded-xl overflow-hidden soft-float pillow-shadow">
          <Image 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqnu1HdJFdIMAFd95sKXlALvVcj4djPg2dFlVhRYrsiXRJSkURQh8L38nI2T8UyZqzZzgPm1vKOToYtAk0bM4_oE3JJP7TCd_pGhrgcBJC65-uwPC6pAR4ogfteB4VuSxAq43yB5N_8F0CAkzDGAQmnaecVmjRJpLeFvAoVcgYhMlz2KBGcAMpXGDusXq2Tw-4P5yRo44Hd3Jgc83RGre3ILUyIgA4fRgFts4H6b28ABU228p0loj6CVS-mHsznuvMkrbShGb5PEQ" 
            alt="Mapa" 
            fill 
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
        </div>

        {/* Pharmacy List */}
        <div className="space-y-4">
          {data.pharmacies.map((pharm, i) => (
            <div key={i} className="flex items-center gap-4 bg-surface-container p-4 rounded-lg border border-white/20 soft-float">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-primary text-3xl">local_pharmacy</span>
              </div>
              <div className="flex-grow">
                <h4 className="font-bold text-on-surface text-lg">{pharm.name}</h4>
                <p className="text-xs text-on-surface-variant font-medium">{pharm.distance} • {pharm.status}</p>
              </div>
              <Button
                asChild
                className="bg-[#25D366] hover:bg-[#128C7E] text-white px-4 h-11 rounded-full flex items-center gap-2 shadow-sm"
              >
                <a href={`https://wa.me/${pharm.whatsapp}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span className="font-bold text-xs">WhatsApp</span>
                </a>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Final Message */}
      <div className="bg-primary-container/20 p-8 rounded-xl text-center space-y-4 border-2 border-dashed border-primary/20">
        <Heart className="w-12 h-12 text-primary mx-auto fill-primary" />
        <p className="font-headline font-bold text-primary italic text-lg">
          "Não esqueça de tomar uma aguinha também, viu, meu anjo?"
        </p>
      </div>

      <Button
        onClick={onReset}
        className="w-full h-16 text-xl font-bold rounded-full bg-primary text-white shadow-xl flex items-center justify-center gap-3"
      >
        <RefreshCcw className="w-6 h-6" />
        Voltar ao Início
      </Button>
    </div>
  );
}
