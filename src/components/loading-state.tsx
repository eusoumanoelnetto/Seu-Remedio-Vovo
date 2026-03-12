
import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export function LoadingState({ message = "Lendo com carinho..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-20 px-8 text-center animate-fade-in w-full">
      <div className="relative">
        <div className="w-48 h-48 rounded-full border-4 border-[#1e1b13] flex items-center justify-center bg-white shadow-[8px_8px_0px_#1e1b13]">
          <Loader2 className="w-24 h-24 text-primary animate-spin" />
        </div>
        <div className="absolute -top-4 -right-4 bg-tertiary-container p-4 rounded-full shadow-lg border-2 border-[#1e1b13] rotate-12">
          <Sparkles className="w-10 h-10 text-on-tertiary-container" />
        </div>
      </div>
      
      <div className="space-y-6 max-w-sm">
        <h2 className="font-headline text-4xl font-extrabold text-primary leading-tight">{message}</h2>
        <div className="bg-surface-container-low p-8 rounded-[2.5rem] border-2 border-[#1e1b13] shadow-[4px_4px_0px_#1e1b13] italic">
          <p className="text-2xl text-on-surface font-medium leading-relaxed">
            "Só um momentinho, vovó. Estou olhando cada detalhe para cuidar bem da senhora!"
          </p>
        </div>
      </div>
    </div>
  );
}
