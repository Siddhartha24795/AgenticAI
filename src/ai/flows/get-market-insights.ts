
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
  location: z.string().describe('The city/location for the market analysis.'),
  marketData: z.string().describe('JSON string market data with crop prices. The data is in a `records` array and may have an `isDummyData` flag. Records may include `modal_price`, `yesterday_price`, `last_5_days_min`, and `last_5_days_max`.'),
  language: z.string().describe("The language for the response (e.g., 'English', 'Kannada', 'Hindi')."),
});
export type GetMarketInsightsInput = z.infer<typeof GetMarketInsightsInputSchema>;

const GetMarketInsightsOutputSchema = z.object({
  marketSummary: z.string().describe('A simple, actionable summary of market conditions for the specified crop, including a comparative analysis and selling recommendation.'),
});
export type GetMarketInsightsOutput = z.infer<typeof GetMarketInsightsOutputSchema>;

export async function getMarketInsights(input: GetMarketInsightsInput): Promise<GetMarketInsightsOutput> {
  return getMarketInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'marketInsightsPrompt',
  input: {schema: GetMarketInsightsInputSchema},
  output: {schema: GetMarketInsightsOutputSchema},
  prompt: `You are an agricultural market analyst. A farmer from {{location}} asked: "{{cropQuery}}". I have fetched the following market data: {{{marketData}}}.

You must respond in a JSON format. The 'marketSummary' field in the JSON should contain your analysis.

Your response MUST start with "The current modal price...". Do not mention if the data is dummy or live.

Analyze the 'records' array in this data. Your entire analysis should be focused ONLY on the specific commodity mentioned in the farmer's query for the specified {{location}}.

If the 'records' array is empty or does not contain data for the specified {{location}}, you must state that you couldn't find data for that exact place and are providing data for the nearest available market based on the provided data. Then proceed with the analysis for that nearby market.

The prices in the data are per quintal. Your analysis must always present the final price in QUINTALS. If any data has prices per kg, you must convert it to per quintal (1 quintal = 100 kg).

After stating the current price, provide a comparative analysis. Compare the current 'modal_price' with 'yesterday_price', 'last_5_days_min', and 'last_5_days_max'. State whether the price is higher or lower than yesterday and how it compares to the 5-day range.

Finally, based on this analysis, provide a clear recommendation on whether it is a good time to sell the crop. For example: "This is the best time to sell." or "You might consider waiting as prices are currently low."

Your entire analysis must be in simple, clear {{language}}.`,
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
