import React from 'react';
import { Loader2, Heart } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Estou lendo o remédio..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-10 py-20 px-6 text-center animate-fade-in w-full">
      <div className="relative">
        <div className="w-40 h-40 rounded-full border-[12px] border-primary/5 flex items-center justify-center bg-white shadow-xl">
          <Loader2 className="w-20 h-20 text-primary animate-spin" />
        </div>
        <div className="absolute inset-0 w-40 h-40 rounded-full border-[12px] border-primary border-t-transparent animate-spin" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Heart className="w-8 h-8 text-primary/20 fill-primary/10" />
        </div>
      </div>
      
      <div className="space-y-4 max-w-sm">
        <h2 className="text-3xl font-bold text-primary leading-tight">{message}</h2>
        <p className="text-xl text-muted-foreground font-medium italic">
          "Só um momentinho, vovó. Estou vendo cada detalhe com muito carinho para não ter erro!"
        </p>
      </div>
    </div>
  );
}