import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vovó Remédio Fácil',
  description: 'Identificador de remédios simples para vovós',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background min-h-screen">
        {children}
      </body>
    </html>
  );
}
