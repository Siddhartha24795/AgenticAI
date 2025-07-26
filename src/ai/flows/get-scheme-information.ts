
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
  state: z.string().describe("The user's state."),
  district: z.string().describe("The user's district."),
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
  prompt: `You are an expert on government agricultural schemes in India. A farmer from {{district}}, {{state}} asked: "{{schemeQuery}}".

You must respond in a JSON format. The 'schemeInformation' field should contain your response. Your entire response must be in {{language}}.

Your response must have two parts:

Part 1: Detailed Answer to the Query
- Based on the provided documents, find all schemes that directly answer the farmer's query: "{{schemeQuery}}".
- For each matching scheme, you MUST format the information as follows:
1.  **Policy Name**: (Include abbreviation if any).
2.  **Scope**: (Central / State / District).
3.  **Eligibility Criteria**: (Detail who can apply).
4.  **Offerings / Benefits**: (Describe the financial aid, subsidies, insurance, etc.).
5.  **Official Links / References**: (Provide only official government websites).
6.  **Current Status**: (e.g., Active, Applications Open, etc.).

If no scheme directly matches the query, state that clearly.

Part 2: Other Relevant Schemes
- After answering the query, add a separator and a heading "Other Relevant Schemes for {{district}}, {{state}}".
- Under this heading, list other relevant Central, State, or District-level schemes from the documents that might be useful for a farmer in this location, even if they don't match the specific query.
- For this list, provide only the **Policy Name** and a one-sentence summary of its **Offerings / Benefits**.

Your entire response must be clear, well-structured, and easy for a farmer to understand.

Documents:
{{#each schemeDocuments}}
Title: {{this.title}}
Content: {{this.content}}

---

{{/each}}`,
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
