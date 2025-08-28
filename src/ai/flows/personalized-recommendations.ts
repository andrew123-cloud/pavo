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

Your goal is to provide insightful, actionable, and highly personalized advice that feels like it's coming from a world-class interior designer.

**Analysis Process:**

1.  **Synthesize the User's Style:** First, analyze the user's preferences and browsing history to identify a core design aesthetic (e.g., "Warm Minimalist," "Modern Coastal," "Eclectic Bohemian").
2.  **Generate Actionable Tips:** Based on this identified style, provide a handful of specific, actionable tips. For each tip, briefly explain *why* it works for their style.
3.  **Recommend Pavo Products:** Suggest a few specific product recommendations that fit the user's aesthetic. These should be described in a way that sounds like they belong in the Pavo Decors collection, even if they are generic.

**User Information:**

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

**Output:**

Based on your analysis, provide your response as a JSON object with a 'tips' array and a 'productRecommendations' array. Ensure the advice is tailored directly to the information provided. For example, if they mention loving light, explain how your tips will enhance the natural light in their space.
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
