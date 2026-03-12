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
  shortPurpose: z.string().describe('Explicação curtíssima em aspas (ex: "Para baixar a pressão").'),
  longInstruction: z.string().describe('Instrução detalhada de como tomar, em linguagem carinhosa para idosos.'),
  imageSeed: z.string().describe('Uma palavra simples em inglês para gerar uma imagem ilustrativa (ex: pill, syrup).'),
});

const PharmacyInfoSchema = z.object({
  name: z.string().describe('Nome da farmácia.'),
  address: z.string().describe('Endereço da farmácia.'),
  whatsapp: z.string().describe('Número do WhatsApp formatado (ex: 11999999999).'),
  distance: z.string().describe('Distância estimada (ex: 350m).'),
  status: z.string().describe('Status curto (ex: Aberta agora, Entrega rápida).'),
});

const ReadPrescriptionOutputSchema = z.object({
  medicines: z.array(MedicineInfoSchema).describe('Lista de medicamentos identificados.'),
  pharmacies: z.array(PharmacyInfoSchema).describe('As 3 farmácias mais próximas e confiáveis da região.'),
  city: z.string().describe('Cidade detectada do usuário.'),
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
1. Identificar EXATAMENTE os nomes dos remédios.
2. Fornecer um "shortPurpose" (ex: "Para baixar a pressão") e uma "longInstruction" (instrução detalhada e carinhosa).
3. Sugerir 3 farmácias REAIS próximas à localização: {{userLocation}}. Use farmácias reais da região.
4. Fornecer o WhatsApp real ou verossímil da região.

Cidade atual: {{userLocation}}.

Seja acolhedor e use linguagem popular.

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