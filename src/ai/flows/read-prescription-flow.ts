'use server';
/**
 * @fileOverview Um fluxo Genkit para ler receitas médicas, identificar remédios e sugerir farmácias reais próximas ao endereço exato.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReadPrescriptionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Uma foto da receita médica, como um data URI em Base64."
    ),
  userLocation: z.string().optional().describe('Endereço ou bairro do usuário (ex: Campo Grande, Rio de Janeiro).'),
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
  whatsapp: z.string().describe('Número do WhatsApp real da farmácia.'),
  distance: z.string().describe('Distância estimada (ex: 300m da sua rua).'),
  status: z.string().describe('Status curto (ex: Aberta agora).'),
});

const ReadPrescriptionOutputSchema = z.object({
  medicines: z.array(MedicineInfoSchema).describe('Lista de medicamentos identificados.'),
  pharmacies: z.array(PharmacyInfoSchema).describe('As 3 farmácias REAIS mais próximas da localização fornecida.'),
  city: z.string().describe('Bairro e cidade detectada.'),
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
2. Fornecer um "shortPurpose" e uma "longInstruction" carinhosa.
3. Sugerir 3 farmácias REAIS próximas a: {{userLocation}}. 
   IMPORTANTE: Se a localização for Campo Grande, Rio de Janeiro, procure farmácias reais próximas à Rua Augusto de Vasconcelos (como Drogarias Pacheco, Venancio, Raia, etc.).
4. Fornecer o WhatsApp real dessas farmácias.

Seja muito acolhedor e use linguagem popular.

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