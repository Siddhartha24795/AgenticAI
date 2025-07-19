
'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing market insights to farmers.
 *
 * - getMarketInsights - A function that takes a farmer's query about a crop and returns a simple, actionable summary of market conditions.
 * - GetMarketInsightsInput - The input type for the getMarketInsights function, representing the farmer's query.
 * - GetMarketInsightsOutput - The output type for the getMarketInsights function, representing the market insights summary.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetMarketInsightsInputSchema = z.object({
  cropQuery: z.string().describe('The farmer\'s question about a specific crop.'),
  marketData: z.string().describe('JSON string market data.'),
  language: z.string().describe("The language for the response (e.g., 'English', 'Kannada', 'Hindi')."),
});
export type GetMarketInsightsInput = z.infer<typeof GetMarketInsightsInputSchema>;

const GetMarketInsightsOutputSchema = z.object({
  marketSummary: z.string().describe('A simple, actionable summary of market conditions for the specified crop.'),
});
export type GetMarketInsightsOutput = z.infer<typeof GetMarketInsightsOutputSchema>;

export async function getMarketInsights(input: GetMarketInsightsInput): Promise<GetMarketInsightsOutput> {
  return getMarketInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'marketInsightsPrompt',
  input: {schema: GetMarketInsightsInputSchema},
  output: {schema: GetMarketInsightsOutputSchema},
  prompt: `A farmer asked: "{{cropQuery}}". I have fetched the following market data: {{{marketData}}}.
          Please analyze this data and provide a simple, actionable summary for the farmer, guiding their selling decisions. Focus on the price of "tomatoes" if mentioned, otherwise generalize. Respond in clear, easy-to-understand {{language}}.`,
});

const getMarketInsightsFlow = ai.defineFlow(
  {
    name: 'getMarketInsightsFlow',
    inputSchema: GetMarketInsightsInputSchema,
    outputSchema: GetMarketInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
