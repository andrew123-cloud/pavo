// src/ai/flows/personalized-recommendations.ts
'use server';

/**
 * @fileOverview A flow for providing personalized interior design tips and product recommendations based on user preferences across Pavo sites.
 *
 * - personalizedRecommendations - A function that takes user data and returns personalized recommendations.
 * - PersonalizedRecommendationsInput - The input type for the personalizedRecommendations function.
 * - PersonalizedRecommendationsOutput - The return type for the personalizedRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedRecommendationsInputSchema = z.object({
  userId: z.string().describe('The unique identifier of the user.'),
  browsingHistory: z.array(z.string()).describe('The user browsing history across the Pavo sites.'),
  preferences: z.string().describe('User-specified preferences.'),
});

export type PersonalizedRecommendationsInput = z.infer<typeof PersonalizedRecommendationsInputSchema>;

const PersonalizedRecommendationsOutputSchema = z.object({
  tips: z.array(z.string()).describe('Personalized interior design tips.'),
  productRecommendations: z.array(z.string()).describe('Personalized product recommendations.'),
});

export type PersonalizedRecommendationsOutput = z.infer<typeof PersonalizedRecommendationsOutputSchema>;

export async function personalizedRecommendations(input: PersonalizedRecommendationsInput): Promise<PersonalizedRecommendationsOutput> {
  return personalizedRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedRecommendationsPrompt',
  input: {schema: PersonalizedRecommendationsInputSchema},
  output: {schema: PersonalizedRecommendationsOutputSchema},
  prompt: `You are an AI interior design assistant that provides personalized tips and product recommendations to users based on their past browsing history and stated preferences.

  User ID: {{{userId}}}
  Browsing History: {{{browsingHistory}}}
  Preferences: {{{preferences}}}

  Based on this information, provide personalized interior design tips and product recommendations. Return the result as JSON array of strings for tips and a JSON array of strings for product recommendations.
  `,
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


