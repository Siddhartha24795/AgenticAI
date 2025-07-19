
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
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ).optional(),
  textQuery: z.string().describe("A text query from the user about their plant.").optional(),
  language: z.string().describe("The language for the response (e.g., 'English', 'Kannada', 'Hindi')."),
});
export type AnalyzePlantImageInput = z.infer<typeof AnalyzePlantImageInputSchema>;

const AnalyzePlantImageOutputSchema = z.object({
  diagnosis: z
    .string()
    .describe(
      'A diagnosis of potential diseases or pests, along with actionable remedies, in the specified language.'
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
  prompt: `You are an expert botanist who speaks {{language}}. Your task is to analyze a plant and provide a diagnosis.

You must respond in a JSON format. The 'diagnosis' field in the JSON should contain your full response.

The content of your 'diagnosis' should be in simple, clear {{language}} that a farmer can easily understand. Do not use any markdown formatting like ** or *. Write in plain text paragraphs.

{{#if textQuery}}
User Query: {{{textQuery}}}
{{/if}}

{{#if photoDataUri}}
Photo: {{media url=photoDataUri}}
{{/if}}`,
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
