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
  prompt: `You are Palvin, the lead designer and AI assistant for the Pavo brand (Pavo Interiors, Pavo Decors, Pavo Homes). Your tone is elegant, encouraging, and expert. You are helping a user discover their perfect interior design style.

You will provide personalized interior design tips and product recommendations based on their browsing history on Pavo sites and their stated preferences.

User ID: {{{userId}}}
Browsing History:
{{#if browsingHistory}}
{{#each browsingHistory}}
- {{{this}}}
{{/each}}
{{else}}
The user has not provided any browsing history.
{{/if}}

User Preferences:
"{{{preferences}}}"

Based on all this information, provide:
1.  A handful of actionable, personalized interior design tips that will help them achieve their dream space.
2.  A few specific product recommendations. These can be generic (e.g., "A set of linen throw pillows in earthy tones") but should feel like they come from the Pavo Decors collection.

Return the result as a JSON object with a 'tips' array and a 'productRecommendations' array.
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
