// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview Analyzes a plant image and provides a diagnosis of potential diseases or pests, along with actionable remedies.
 *
 * - analyzePlantImage - A function that handles the plant image analysis process.
 * - AnalyzePlantImageInput - The input type for the analyzePlantImage function.
 * - AnalyzePlantImageOutput - The return type for the analyzePlantImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePlantImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzePlantImageInput = z.infer<typeof AnalyzePlantImageInputSchema>;

const AnalyzePlantImageOutputSchema = z.object({
  diagnosis: z
    .string()
    .describe(
      'A diagnosis of potential diseases or pests, along with actionable remedies.'
    ),
});
export type AnalyzePlantImageOutput = z.infer<typeof AnalyzePlantImageOutputSchema>;

export async function analyzePlantImage(
  input: AnalyzePlantImageInput
): Promise<AnalyzePlantImageOutput> {
  return analyzePlantImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePlantImagePrompt',
  input: {schema: AnalyzePlantImageInputSchema},
  output: {schema: AnalyzePlantImageOutputSchema},
  prompt: `Analyze this plant image and provide a diagnosis of potential diseases or pests, along with actionable remedies.

  Photo: {{media url=photoDataUri}}`,
});

const analyzePlantImageFlow = ai.defineFlow(
  {
    name: 'analyzePlantImageFlow',
    inputSchema: AnalyzePlantImageInputSchema,
    outputSchema: AnalyzePlantImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
