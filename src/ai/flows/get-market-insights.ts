
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
  marketData: z.string().describe('JSON string market data with crop prices. The data is in a `records` array.'),
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
  prompt: `You are an agricultural market analyst. A farmer asked: "{{cropQuery}}". I have fetched the following real-time market data from various mandis: {{{marketData}}}.

You must respond in a JSON format. The 'marketSummary' field in the JSON should contain your analysis.

Please analyze the 'records' array in this data and provide a simple, actionable summary for the farmer in clear, easy-to-understand {{language}}. Focus on the price of the requested commodity. If the specific commodity isn't in the data, analyze the general market trends based on the available data. 

If the 'records' array is empty, you must state that the feature is not configured correctly because the API for market data returned no information.

Your analysis should guide their selling decisions. Mention the key commodities and their price ranges from the data.`,
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
