
'use server';

/**
 * @fileOverview This file defines a Genkit flow to retrieve and summarize information about government schemes for farmers.
 *
 * - getSchemeInformation - A function that takes a query about a farming scheme and returns a simple, actionable summary.
 * - GetSchemeInformationInput - The input type for the getSchemeInformation function.
 * - GetSchemeInformationOutput - The return type for the getSchemeInformation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetSchemeInformationInputSchema = z.object({
  schemeQuery: z.string().describe('The query about a farming scheme.'),
  schemeDocuments: z.array(z.object({
    title: z.string(),
    content: z.string()
  })).describe('Array of government scheme documents to use for RAG.'),
  language: z.string().describe("The language for the response (e.g., 'English', 'Kannada', 'Hindi')."),
});
export type GetSchemeInformationInput = z.infer<typeof GetSchemeInformationInputSchema>;

const GetSchemeInformationOutputSchema = z.object({
  schemeInformation: z.string().describe('A simple, actionable summary of relevant government schemes including eligibility requirements and application links.')
});
export type GetSchemeInformationOutput = z.infer<typeof GetSchemeInformationOutputSchema>;

export async function getSchemeInformation(input: GetSchemeInformationInput): Promise<GetSchemeInformationOutput> {
  return getSchemeInformationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getSchemeInformationPrompt',
  input: {schema: GetSchemeInformationInputSchema},
  output: {schema: GetSchemeInformationOutputSchema},
  prompt: `You are an expert on government agricultural schemes in India. A farmer asked: "{{schemeQuery}}".

You must respond in a JSON format. The 'schemeInformation' field should contain your response.

Based on the following government scheme documents, explain the relevant national or state-specific schemes in simple {{language}}. List eligibility requirements and provide direct links to application portals. If no relevant scheme is found, state that. Your response must be clear, concise, and easy for a farmer to understand.

Documents:
{{#each schemeDocuments}}Title: {{this.title}}\nContent: {{this.content}}\n\n---\n\n{{/each}}`,
});


const getSchemeInformationFlow = ai.defineFlow(
  {
    name: 'getSchemeInformationFlow',
    inputSchema: GetSchemeInformationInputSchema,
    outputSchema: GetSchemeInformationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
