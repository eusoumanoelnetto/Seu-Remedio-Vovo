"use client"

import React from 'react';
import { FileText, MapPin, MessageCircle, RefreshCcw, Pill, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import type { ReadPrescriptionOutput } from '@/ai/flows/read-prescription-flow';

interface PrescriptionResultProps {
  data: ReadPrescriptionOutput;
  onReset: () => void;
}

export function PrescriptionResult({ data, onReset }: PrescriptionResultProps) {
  return (
    <div className="flex flex-col space-y-12 animate-fade-in p-2 pb-12 w-full">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-secondary/10 mb-2 border-4 border-white shadow-inner">
          <FileText className="w-12 h-12 text-secondary" />
        </div>
        <div>
          <h2 className="text-4xl font-bold text-foreground">Receita Lida!</h2>
          <p className="text-xl text-muted-foreground font-medium">Aqui está o que eu encontrei:</p>
        </div>
      </div>

      {/* Medicamentos */}
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-4">
          <div className="bg-primary p-2 rounded-xl">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Remédios na Lista:</h3>
        </div>
        
        <div className="grid gap-6">
          {data.medicines.map((med, idx) => (
            <Card key={idx} className="card-elegant border-none overflow-hidden group">
              <CardContent className="p-0">
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={`https://picsum.photos/seed/${med.imageSeed}/600/300`}
                    alt={med.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    data-ai-hint="medicine box"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="p-8 space-y-3">
                  <h4 className="text-3xl font-bold text-primary">{med.name}</h4>
                  <p className="text-xl text-foreground/70 leading-relaxed font-medium">{med.purpose}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Farmácias */}
      <div className="space-y-8 pt-6">
        <div className="flex items-center gap-3 px-4">
          <div className="bg-secondary p-2 rounded-xl">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Farmácias Próximas:</h3>
        </div>

        <div className="grid gap-6">
          {data.pharmacies.map((pharm, idx) => (
            <Card key={idx} className="card-elegant border-none bg-white/70">
              <CardContent className="p-8 flex flex-col space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-2xl font-bold text-foreground">{pharm.name}</h4>
                    <span className="bg-secondary/10 text-secondary text-sm font-bold px-3 py-1 rounded-full border border-secondary/20">
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
          <HeartPulse className="w-6 h-6 mr-2" />
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