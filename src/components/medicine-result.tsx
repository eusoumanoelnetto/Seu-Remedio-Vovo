import React from 'react';
import { Pill, Info, RefreshCcw, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface MedicineResultProps {
  medicineName: string;
  explanation: string;
  onReset: () => void;
}

export function MedicineResult({ medicineName, explanation, onReset }: MedicineResultProps) {
  return (
    <div className="flex flex-col space-y-8 animate-fade-in p-2 pb-12 w-full">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-2 border-4 border-white shadow-inner">
          <Pill className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-4xl font-bold text-primary break-words leading-tight px-4">
          {medicineName}
        </h2>
      </div>

      <Card className="card-elegant border-none">
        <CardContent className="p-8 sm:p-10 space-y-8">
          <div className="flex items-start space-x-5">
            <div className="mt-1 p-3 bg-accent rounded-2xl">
              <Info className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <p className="text-2xl font-bold text-foreground">
                Para que serve?
              </p>
              <div className="p-1">
                <p className="text-2xl text-foreground/80 leading-relaxed font-medium">
                  {explanation}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center pt-4 border-t border-accent">
            <Heart className="w-6 h-6 text-primary mr-2 fill-primary/10" />
            <p className="text-lg text-muted-foreground font-medium italic">
              Use sempre conforme a receita, vovó.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="pt-6">
        <Button
          onClick={onReset}
          className="w-full h-24 text-2xl font-bold rounded-[2.5rem] shadow-xl btn-hover bg-secondary text-white flex items-center justify-center gap-4"
        >
          <RefreshCcw className="w-8 h-8" />
          Ver outro remédio
        </Button>
      </div>
    </div>
  );
}