import React from 'react';
import { Pill, Info, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface MedicineResultProps {
  medicineName: string;
  explanation: string;
  onReset: () => void;
}

export function MedicineResult({ medicineName, explanation, onReset }: MedicineResultProps) {
  return (
    <div className="flex flex-col space-y-8 animate-in slide-in-from-bottom-8 duration-500 p-4 pb-12">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-2">
          <Pill className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-4xl font-bold text-primary break-words leading-tight">
          {medicineName}
        </h2>
      </div>

      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden rounded-3xl">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-start space-x-4">
            <div className="mt-1">
              <Info className="w-8 h-8 text-secondary" />
            </div>
            <div className="space-y-4">
              <p className="text-2xl font-bold text-foreground leading-relaxed">
                Para que serve?
              </p>
              <p className="text-2xl text-foreground/90 leading-relaxed font-medium">
                {explanation}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="pt-4 px-2">
        <Button
          onClick={onReset}
          className="w-full h-24 text-2xl font-bold rounded-[2rem] shadow-lg flex items-center justify-center gap-4 hover:scale-[1.02] transition-transform active:scale-95 bg-secondary text-secondary-foreground"
        >
          <RefreshCcw className="w-8 h-8" />
          Ver outro remédio
        </Button>
      </div>
    </div>
  );
}
