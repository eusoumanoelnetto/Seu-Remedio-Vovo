"use client"

import React from 'react';
import { FileText, MapPin, MessageCircle, RefreshCcw, Pill } from 'lucide-react';
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
    <div className="flex flex-col space-y-8 animate-in slide-in-from-bottom-8 duration-500 p-4 pb-12 w-full">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary/10 mb-2">
          <FileText className="w-10 h-10 text-secondary" />
        </div>
        <h2 className="text-3xl font-bold text-primary">Receita Lida!</h2>
      </div>

      {/* Medicamentos */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-foreground px-2 flex items-center gap-2">
          <Pill className="text-primary" /> Remédios na Receita:
        </h3>
        {data.medicines.map((med, idx) => (
          <Card key={idx} className="border-none shadow-lg bg-white rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <div className="relative h-40 w-full">
                <Image
                  src={`https://picsum.photos/seed/${med.imageSeed}/400/200`}
                  alt={med.name}
                  fill
                  className="object-cover"
                  data-ai-hint="medicine pill"
                />
              </div>
              <div className="p-6 space-y-2">
                <h4 className="text-2xl font-bold text-primary">{med.name}</h4>
                <p className="text-xl text-foreground/80 leading-relaxed">{med.purpose}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Farmácias */}
      <div className="space-y-6 pt-4">
        <h3 className="text-2xl font-bold text-foreground px-2 flex items-center gap-2">
          <MapPin className="text-secondary" /> Farmácias Próximas:
        </h3>
        {data.pharmacies.map((pharm, idx) => (
          <Card key={idx} className="border-none shadow-md bg-white/60 rounded-3xl">
            <CardContent className="p-6 flex flex-col space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-bold text-foreground">{pharm.name}</h4>
                  <p className="text-lg text-muted-foreground leading-tight">{pharm.address}</p>
                  <p className="text-primary font-bold mt-1">Apenas {pharm.distance}</p>
                </div>
              </div>
              <Button
                asChild
                className="w-full h-16 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white text-xl font-bold flex items-center gap-3"
              >
                <a 
                  href={`https://wa.me/55${pharm.whatsapp}?text=Olá,%20vi%20sua%20farmácia%20no%20Vovó%20Remédio%20e%20gostaria%20de%20saber%20o%20preço%20destes%20itens.`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-6 h-6" />
                  WhatsApp da Farmácia
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="pt-4 px-2">
        <Button
          onClick={onReset}
          className="w-full h-20 text-2xl font-bold rounded-3xl shadow-lg flex items-center justify-center gap-4 bg-primary text-white"
        >
          <RefreshCcw className="w-8 h-8" />
          Voltar ao Início
        </Button>
      </div>
    </div>
  );
}
