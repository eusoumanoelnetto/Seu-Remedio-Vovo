import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Estou lendo o remédio..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12 px-6 text-center animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-32 h-32 rounded-full border-8 border-primary/20 flex items-center justify-center">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
        </div>
        <div className="absolute inset-0 w-32 h-32 rounded-full border-8 border-primary border-t-transparent animate-spin" />
      </div>
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-primary">{message}</h2>
        <p className="text-xl text-muted-foreground font-medium">
          Só um momentinho que a vovó já te conta!
        </p>
      </div>
    </div>
  );
}
