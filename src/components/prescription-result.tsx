
"use client"

import React, { useState, useEffect } from 'react';
import { Volume2, Loader2, Heart, MapPin, MessageCircle, RefreshCcw, CheckCircle2, Edit2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import type { ReadPrescriptionOutput } from '@/ai/flows/read-prescription-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

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
  const [isLocating, setIsLocating] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(data.city);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(data.city);
  const { toast } = useToast();

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

  const handleConfirmLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Usando Nominatim (OpenStreetMap) para reverse geocoding
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=18&addressdetails=1`,
              { headers: { 'Accept-Language': 'pt-BR' } }
            );
            const addressData = await response.json();
            
            // Prioriza o bairro (suburb/neighbourhood) e a cidade
            const neighborhood = addressData.address.suburb || addressData.address.neighbourhood || addressData.address.city_district || addressData.address.village;
            const city = addressData.address.city || addressData.address.town || addressData.address.municipality || "sua cidade";
            const state = addressData.address.state;
            
            let fullReadableAddress = "";
            if (neighborhood) {
              fullReadableAddress = neighborhood;
              if (city && neighborhood !== city) fullReadableAddress += `, ${city}`;
            } else {
              fullReadableAddress = city;
            }

            // Se ainda assim der Virginia (comum em ambientes de nuvem), avisamos a vovó
            if (fullReadableAddress.toLowerCase().includes('virginia') || fullReadableAddress.toLowerCase().includes('united states')) {
              setIsLocating(false);
              toast({
                title: "Achei um lugar longe!",
                description: "Vovó, o GPS está dizendo que a senhora está nos EUA! Vamos corrigir para o Rio?",
              });
              setIsEditingAddress(true);
              return;
            }

            setCurrentAddress(fullReadableAddress);
            setIsLocating(false);
            setLocationConfirmed(true);
            toast({
              title: "Te achei, vovó!",
              description: `Que maravilha! Já sei que a senhora está em ${fullReadableAddress}.`,
            });
          } catch (err) {
            console.error("Geocoding error:", err);
            setIsLocating(false);
            setLocationConfirmed(true); 
            toast({
              variant: "destructive",
              title: "Erro de endereço",
              description: "Não consegui ler o nome da rua, mas sei que a senhora está por aqui!",
            });
          }
        },
        (error) => {
          setIsLocating(false);
          let message = "Não consegui te achar, vovó. Pode ser que o GPS esteja desligado.";
          
          if (error.code === error.PERMISSION_DENIED) {
            message = "Vovó, a senhora precisa clicar em 'Permitir' na janelinha do navegador para eu te achar!";
          }

          toast({
            variant: "destructive",
            title: "Erro de localização",
            description: message,
          });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsLocating(false);
      toast({
        variant: "destructive",
        title: "Ih, vovó!",
        description: "Seu celular não tem a função de GPS funcionando agora.",
      });
    }
  };

  const handleSaveAddress = () => {
    if (tempAddress.trim()) {
      setCurrentAddress(tempAddress);
      setIsEditingAddress(false);
      setLocationConfirmed(true);
      toast({
        title: "Endereço atualizado!",
        description: `Entendido, vovó! Agora estamos em ${tempAddress}.`,
      });
    }
  };

  // Lógica para busca de imagem: se for Rio, busca Cristo Redentor
  const cityForImage = currentAddress.split(',').pop()?.trim() || currentAddress;
  const isRio = currentAddress.toLowerCase().includes('rio') || currentAddress.toLowerCase().includes('janeiro');
  const cityImageHint = isRio ? "cristo redentor corcovado rio de janeiro landmark" : `${cityForImage} city landmark tourism`;
  const cityImageSeed = cityForImage.toLowerCase().replace(/\s+/g, '-') + "-vovo-city-v2";

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <header className="text-center space-y-4 py-6">
        <span className="inline-block px-6 py-2 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-extrabold text-xs uppercase tracking-widest border-[3px] border-[#1e1b13] shadow-[4px_4px_0px_#1e1b13]">
          INTELIGÊNCIA DO NETINHO
        </span>
        <h2 className="font-headline font-extrabold text-5xl text-on-background tracking-tight">Sua Receitinha</h2>
        <p className="text-on-surface-variant font-bold text-xl px-4 italic">
          "O Netinho leu tudinho e encontrou esses remédios para a senhora!"
        </p>
      </header>

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

      <section className="space-y-8 pt-4">
        <div className="space-y-4 px-2 flex flex-col">
          <h2 className="font-headline font-extrabold text-3xl text-on-background">Farmácias Perto de Você</h2>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-5 py-3 rounded-full border-[3px] border-[#1e1b13] shadow-[4px_4px_0px_#1e1b13]">
              <MapPin className="w-6 h-6 text-primary" />
              <span className="font-bold text-on-surface-variant text-lg">
                {locationConfirmed ? `Vovó, achamos farmácias em ${currentAddress}!` : "Vovó, clique no marcador para eu te achar!"}
              </span>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => setIsEditingAddress(true)}
              className="text-primary font-bold flex items-center gap-2 hover:bg-primary-container/20 rounded-full h-12 border-[2px] border-transparent hover:border-[#1e1b13] transition-all"
            >
              <Edit2 className="w-5 h-5" />
              Não mora nesse lugar?
            </Button>
          </div>

          {isEditingAddress && (
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-in bg-white p-6 rounded-[2rem] border-[4px] border-[#1e1b13] shadow-[8px_8px_0px_#1e1b13]">
              <div className="flex-1 space-y-2">
                <p className="font-bold text-primary ml-2">Onde a senhora mora, vovó?</p>
                <Input 
                  value={tempAddress} 
                  onChange={(e) => setTempAddress(e.target.value)}
                  placeholder="Ex: Campo Grande, Rio de Janeiro"
                  className="h-14 border-[3px] border-[#1e1b13] rounded-xl font-bold text-xl px-6"
                />
              </div>
              <Button 
                onClick={handleSaveAddress} 
                className="h-14 bg-primary text-white font-extrabold text-xl border-[3px] border-[#1e1b13] shadow-[4px_4px_0px_#1e1b13] px-10 rounded-xl"
              >
                Confirmar
              </Button>
            </div>
          )}
        </div>

        <div className="relative h-96 rounded-[3.5rem] overflow-hidden border-[5px] border-[#1e1b13] shadow-[15px_15px_0px_#1e1b13] ambient-float group">
          <Image 
            src={`https://picsum.photos/seed/${cityImageSeed}/800/600`} 
            alt={`Foto de ${currentAddress || 'sua localização'}`} 
            fill 
            data-ai-hint={cityImageHint}
            className="object-cover opacity-90 transition-transform group-hover:scale-110 duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6 w-full px-10">
            <button 
              onClick={handleConfirmLocation}
              disabled={isLocating}
              className={`relative w-24 h-24 rounded-full border-[5px] border-[#1e1b13] shadow-2xl flex items-center justify-center transition-all active:scale-90 ${locationConfirmed ? 'bg-secondary text-white' : 'bg-white text-primary'}`}
            >
              {!locationConfirmed && !isLocating && (
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              )}
              {isLocating ? (
                <Loader2 className="w-12 h-12 animate-spin" />
              ) : locationConfirmed ? (
                <CheckCircle2 className="w-12 h-12" />
              ) : (
                <span className="material-symbols-outlined text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
              )}
            </button>
            
            <div className="bg-white/95 backdrop-blur-md px-10 py-4 rounded-[2rem] border-[4px] border-[#1e1b13] shadow-xl max-w-[95%]">
              <p className="font-extrabold text-primary text-xl uppercase tracking-tight text-center truncate">
                {isLocating ? "Te procurando com carinho..." : locationConfirmed ? currentAddress : "Clique para me deixar te achar!"}
              </p>
            </div>
            
            {!locationConfirmed && !isLocating && (
              <div className="bg-tertiary-fixed text-on-tertiary-fixed px-6 py-2 rounded-full border-[2px] border-[#1e1b13] font-bold animate-bounce">
                Aperte no marcador, vovó! 👆
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {data.pharmacies.map((pharm, i) => (
            <div key={i} className="flex items-center gap-6 bg-white p-6 rounded-[2.5rem] border-[4px] border-[#1e1b13] shadow-[8px_8px_0px_#1e1b13] group hover:translate-x-1 transition-transform">
              <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0 pillow-shadow border-[3px] border-[#1e1b13]">
                <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_pharmacy</span>
              </div>
              <div className="flex-grow">
                <h4 className="font-extrabold text-on-surface text-2xl mb-1">{pharm.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="bg-accent px-3 py-1 rounded-full border-[2px] border-[#1e1b13] text-sm font-bold text-on-surface-variant">
                    {pharm.distance}
                  </span>
                  <span className="font-bold text-secondary text-sm">{pharm.status}</span>
                </div>
              </div>
              <Button
                asChild
                className="bg-[#25D366] hover:bg-[#128C7E] text-white px-8 h-16 rounded-full flex items-center gap-3 border-[3px] border-[#1e1b13] shadow-[5px_5px_0px_#1e1b13] active:translate-y-1 active:shadow-none transition-all"
              >
                <a href={`https://wa.me/${pharm.whatsapp}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-7 h-7" />
                  <span className="font-extrabold text-lg">ZAP</span>
                </a>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <div className="bg-primary-container/20 p-12 rounded-[3.5rem] text-center space-y-6 border-[4px] border-dashed border-[#1e1b13]/30">
        <Heart className="w-20 h-20 text-primary fill-primary mx-auto animate-pulse" />
        <p className="font-headline font-extrabold text-primary italic text-3xl leading-relaxed">
          "Não esqueça de tomar uma aguinha também, viu, meu anjo? O netinho te ama!"
        </p>
      </div>

      <Button
        onClick={onReset}
        className="w-full h-24 text-3xl font-extrabold rounded-full bg-primary text-white shadow-[12px_12px_0px_#1e1b13] border-[4px] border-[#1e1b13] flex items-center justify-center gap-5 active:translate-y-2 active:shadow-none transition-all"
      >
        <RefreshCcw className="w-10 h-10" />
        Voltar ao Início
      </Button>
    </div>
  );
}
