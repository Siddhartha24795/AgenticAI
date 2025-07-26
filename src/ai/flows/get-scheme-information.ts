
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
  age: z.number().describe("The user's age.").optional(),
});
export type GetSchemeInformationInput = z.infer<typeof GetSchemeInformationInputSchema>;

const GetSchemeInformationOutputSchema = z.object({
  schemeInformation: z.string().describe('A simple, actionable summary of the queried government scheme including eligibility requirements and application links.'),
  otherRelevantSchemes: z.string().describe('A list of other relevant schemes for the user based on their location and age.').optional(),
});
export type GetSchemeInformationOutput = z.infer<typeof GetSchemeInformationOutputSchema>;

export async function getSchemeInformation(input: GetSchemeInformationInput): Promise<GetSchemeInformationOutput> {
  return getSchemeInformationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getSchemeInformationPrompt',
  input: {schema: GetSchemeInformationInputSchema},
  output: {schema: GetSchemeInformationOutputSchema},
  prompt: `You are an expert on government agricultural schemes in India. A farmer from {{district}}, {{state}}{{#if age}} aged {{age}}{{/if}} asked: "{{schemeQuery}}".

You must respond in a JSON format. Your entire response must be in {{language}} and use plain text without any markdown formatting like ** or *.

You have two tasks:
1.  Set the 'schemeInformation' field with a detailed answer to the farmer's query.
2.  Set the 'otherRelevantSchemes' field with a list of other relevant schemes.

TASK 1: DETAILED ANSWER (for 'schemeInformation')
- Based on the provided documents, find the single most relevant scheme that directly answers the farmer's query: "{{schemeQuery}}".
- For this single matching scheme, you MUST format the information as follows, using the exact headings:
1. Policy Name: (Include abbreviation if any).
2. Scope: (Central / State / District).
3. Eligibility Criteria: (Detail who can apply, including any age or location specifics).
4. Offerings / Benefits: (Describe the financial aid, subsidies, insurance, etc.).
5. Official Links / References: (Provide only official government websites).
6. Current Status: (e.g., Active, Applications Open, etc.).

- After listing the details, add a new line and a heading "Personalized Eligibility".
- Under this heading, analyze the farmer's details (age: {{#if age}}{{age}}{{else}}Not Provided{{/if}}, location: {{district}}, {{state}}) against the scheme's eligibility criteria.
- State clearly whether the farmer is likely eligible or not, and explain why. For example: "Based on your age of {{age}} and location, you appear to be eligible for this scheme." or "You may not be eligible due to the age requirement."

If no scheme directly matches the query, state that clearly in the 'schemeInformation' field.

TASK 2: OTHER RELEVANT SCHEMES (for 'otherRelevantSchemes')
- Review all the provided documents again.
- Identify other Central, State, or District-level schemes that could be beneficial for a farmer in {{district}}, {{state}}{{#if age}} of age {{age}}{{/if}}, even if they don't match the specific query.
- For this list, provide only the "Policy Name" and a one-sentence summary of its "Offerings / Benefits" for each scheme.
- If no schemes seem relevant based on the user's profile, provide a general list of at least two important national schemes like "Kisan Credit Card (KCC)" and "Pradhan Mantri Fasal Bima Yojana (PMFBY)" with their official links. Ensure this field is never empty.

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
