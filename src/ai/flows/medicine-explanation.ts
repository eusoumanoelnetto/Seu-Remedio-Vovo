'use server';
/**
 * @fileOverview A Genkit flow for identifying medicine from a photo and explaining its purpose in simple terms.
 *
 * - explainMedicine - A function that handles the medicine explanation process.
 * - MedicineExplanationInput - The input type for the explainMedicine function.
 * - MedicineExplanationOutput - The return type for the explainMedicine function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MedicineExplanationInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the medicine, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type MedicineExplanationInput = z.infer<typeof MedicineExplanationInputSchema>;

const MedicineExplanationOutputSchema = z.object({
  medicineName: z.string().describe('The identified name of the medicine.'),
  simpleExplanation: z
    .string()
    .describe('A simple, easy-to-understand explanation of what the medicine is used for, avoiding technical jargon.'),
});
export type MedicineExplanationOutput = z.infer<typeof MedicineExplanationOutputSchema>;

export async function explainMedicine(
  input: MedicineExplanationInput
): Promise<MedicineExplanationOutput> {
  return medicineExplanationFlow(input);
}

const medicineExplanationPrompt = ai.definePrompt({
  name: 'medicineExplanationPrompt',
  input: {schema: MedicineExplanationInputSchema},
  output: {schema: MedicineExplanationOutputSchema},
  prompt: `Você é um assistente prestativo para avós. Sua tarefa é identificar medicamentos a partir de suas fotos e explicar seu propósito em uma linguagem simples, fácil de entender e popular, evitando qualquer jargão médico técnico. Use termos populares e leigos.

Identifique o medicamento na foto e forneça seu nome e uma explicação simples para que ele é usado.

Photo: {{media url=photoDataUri}}`,
});

const medicineExplanationFlow = ai.defineFlow(
  {
    name: 'medicineExplanationFlow',
    inputSchema: MedicineExplanationInputSchema,
    outputSchema: MedicineExplanationOutputSchema,
  },
  async input => {
    const {output} = await medicineExplanationPrompt(input);
    return output!;
  }
);
