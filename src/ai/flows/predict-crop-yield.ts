'use server';

/**
 * @fileOverview Predicts crop yield based on historical data, weather patterns, and soil metrics.
 *
 * - predictCropYield - A function that predicts crop yield.
 * - PredictCropYieldInput - The input type for the predictCropYield function.
 * - PredictCropYieldOutput - The return type for the predictCropYield function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictCropYieldInputSchema = z.object({
  cropType: z.string().describe('The type of crop.'),
  region: z.string().describe('The region where the crop is grown.'),
  historicalData: z.string().describe('Historical agricultural data in JSON format.'),
  weatherPatterns: z.string().describe('Weather patterns data in JSON format, including temperature, humidity, and rainfall.'),
  soilMetrics: z.string().describe('Soil metrics data in JSON format. This will include soil pH, and may optionally include Nitrogen (N), Phosphorus (P), and Potassium (K) levels in kg/ha.'),
  previousCrop: z.string().describe('The crop that was grown in the previous season. Use this to estimate N-P-K values if they are not provided in soilMetrics.'),
  language: z.string().describe('The language for the recommendations.'),
  area: z.string().describe('The area of the farm.'),
});
export type PredictCropYieldInput = z.infer<typeof PredictCropYieldInputSchema>;

const PredictCropYieldOutputSchema = z.object({
  predictedYield: z.number().describe('The predicted crop yield in appropriate units (e.g., tons per hectare).'),
  confidenceInterval: z.string().describe('The confidence interval for the predicted yield.'),
  recommendations: z.string().describe('Actionable recommendations for irrigation, fertilization, and pest control.'),
});
export type PredictCropYieldOutput = z.infer<typeof PredictCropYieldOutputSchema>;

export async function predictCropYield(input: PredictCropYieldInput): Promise<PredictCropYieldOutput> {
  return predictCropYieldFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictCropYieldPrompt',
  input: {schema: PredictCropYieldInputSchema},
  output: {schema: PredictCropYieldOutputSchema},
  prompt: `You are an expert agricultural advisor. Based on the historical data, weather patterns, and soil metrics provided, predict the crop yield and provide actionable recommendations. The recommendations should be in the language: {{{language}}}.

If Nitrogen, Phosphorus, and Potassium (N-P-K) levels are not provided in the soilMetrics, estimate them based on the previous crop grown. For example, legumes like soybeans fix nitrogen, so the soil will be richer in nitrogen. If N-P-K values are provided, use them directly for a more precise prediction.

Crop Type: {{{cropType}}}
Region: {{{region}}}
Area: {{{area}}}
Previous Crop: {{{previousCrop}}}
Historical Data: {{{historicalData}}}
Weather Patterns: {{{weatherPatterns}}}
Soil Metrics: {{{soilMetrics}}}

Provide the predicted yield, a confidence interval, and specific recommendations for irrigation, fertilization, and pest control based on your estimated or provided N-P-K values and the other provided data.
`,
});

const predictCropYieldFlow = ai.defineFlow(
  {
    name: 'predictCropYieldFlow',
    inputSchema: PredictCropYieldInputSchema,
    outputSchema: PredictCropYieldOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
