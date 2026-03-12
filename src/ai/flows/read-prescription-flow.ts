
'use server';
/**
 * @fileOverview Um fluxo Genkit para ler receitas médicas, identificar remédios e sugerir farmácias baseando-se na localização real.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReadPrescriptionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Uma foto da receita médica, como um data URI em Base64."
    ),
  userLocation: z.string().optional().describe('Coordenadas ou endereço do usuário para busca de farmácias.'),
});
export type ReadPrescriptionInput = z.infer<typeof ReadPrescriptionInputSchema>;

const MedicineInfoSchema = z.object({
  name: z.string().describe('Nome exato do medicamento encontrado na receita.'),
  purpose: z.string().describe('Explicação simples para que serve.'),
  imageSeed: z.string().describe('Uma palavra simples em inglês para gerar uma imagem ilustrativa (ex: pill, syrup).'),
});

const PharmacyInfoSchema = z.object({
  name: z.string().describe('Nome da farmácia.'),
  address: z.string().describe('Endereço da farmácia.'),
  whatsapp: z.string().describe('Número do WhatsApp formatado para link (apenas números com DDD).'),
  distance: z.string().describe('Distância estimada (ex: 500m).'),
});

const ReadPrescriptionOutputSchema = z.object({
  medicines: z.array(MedicineInfoSchema).describe('Lista de medicamentos identificados.'),
  pharmacies: z.array(PharmacyInfoSchema).describe('As 3 farmácias mais próximas e confiáveis da região.'),
});
export type ReadPrescriptionOutput = z.infer<typeof ReadPrescriptionOutputSchema>;

export async function readPrescription(
  input: ReadPrescriptionInput
): Promise<ReadPrescriptionOutput> {
  return readPrescriptionFlow(input);
}

const readPrescriptionPrompt = ai.definePrompt({
  name: 'readPrescriptionPrompt',
  input: {schema: ReadPrescriptionInputSchema},
  output: {schema: ReadPrescriptionOutputSchema},
  prompt: `Você é um assistente farmacêutico gentil para idosos. 
Sua tarefa é ler a foto de uma RECEITA MÉDICA e:
1. Identificar EXATAMENTE os nomes dos remédios escritos. Seja extremamente preciso, pois erros podem ser perigosos.
2. Explicar de forma muito simples (linguagem para vovós) para que servem.
3. Sugerir 3 farmácias REAIS próximas à localização do usuário: {{userLocation}}. 
   Se a localização for coordenadas (Lat/Long), use-as para encontrar farmácias reais naquela área.
   Dê preferência a redes grandes conhecidas (como Droga Raia, Drogasil, Pague Menos) ou farmácias locais populares.
4. Fornecer o número de WhatsApp dessas farmácias (se não souber o real, use um formato padrão verossímil da região).

Seja muito claro e use linguagem popular e acolhedora.

Photo: {{media url=photoDataUri}}`,
});

const readPrescriptionFlow = ai.defineFlow(
  {
    name: 'readPrescriptionFlow',
    inputSchema: ReadPrescriptionInputSchema,
    outputSchema: ReadPrescriptionOutputSchema,
  },
  async input => {
    const {output} = await readPrescriptionPrompt(input);
    return output!;
  }
);
