'use server';
/**
 * @fileOverview A Genkit flow for generating a personalized introductory musical theme.
 *
 * - personalizedMusicalThemeGeneration - A function that generates a unique introductory musical theme.
 * - PersonalizedMusicalThemeGenerationInput - The input type for the personalizedMusicalThemeGeneration function.
 * - PersonalizedMusicalThemeGenerationOutput - The return type for the personalizedMusicalThemeGeneration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedMusicalThemeGenerationInputSchema = z
  .object({})
  .describe('No specific input parameters are required for initial theme generation.');
export type PersonalizedMusicalThemeGenerationInput = z.infer<
  typeof PersonalizedMusicalThemeGenerationInputSchema
>;

const PersonalizedMusicalThemeGenerationOutputSchema = z.object({
  tempoBPM: z.number().describe('The suggested tempo in beats per minute (BPM).'),
  key:
    z.string().describe('The musical key for the theme (e.g., "C Major", "G Minor", "F# Dorian").'),
  scale:
    z.string()
      .describe(
        'The musical scale for the theme (e.g., "pentatonic", "blues", "natural minor", "harmonic minor", "major").'
      ),
  moodDescription:
    z.string().describe('A descriptive text of the overall mood and feeling of the musical theme.'),
  instrumentSuggestions:
    z.array(z.string())
      .describe(
        'An array of suggested instruments suitable for this theme (e.g., ["piano", "synth pad", "light percussion", "flute"]).'
      ),
  loopLengthBars:
    z.number().describe('The suggested length of the initial musical loop in bars (e.g., 4, 8, 16).'),
  melodyIdea:
    z.string()
      .optional()
      .describe('A brief textual idea for a simple melody pattern to seed the piano roll.'),
  drumPatternIdea:
    z.string()
      .optional()
      .describe('A brief textual idea for a simple drum pattern.'),
});
export type PersonalizedMusicalThemeGenerationOutput = z.infer<
  typeof PersonalizedMusicalThemeGenerationOutputSchema
>;

export async function personalizedMusicalThemeGeneration(
  input: PersonalizedMusicalThemeGenerationInput
): Promise<PersonalizedMusicalThemeGenerationOutput> {
  return personalizedMusicalThemeGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedMusicalThemePrompt',
  input: {schema: PersonalizedMusicalThemeGenerationInputSchema},
  output: {schema: PersonalizedMusicalThemeGenerationOutputSchema},
  prompt: `You are an expert music composer assistant for an interactive music app called Biotune.
Your task is to create a unique and personal introductory musical theme.
The theme should evoke a sense of individuality and magic, as if it's being generated directly from the user.
Do not make it overly complex; it should be a simple, looping foundation for a user to build upon, feeling fresh and inspiring.

Based on these guidelines, generate a musical theme in JSON format according to the provided schema.
`,
});

const personalizedMusicalThemeGenerationFlow = ai.defineFlow(
  {
    name: 'personalizedMusicalThemeGenerationFlow',
    inputSchema: PersonalizedMusicalThemeGenerationInputSchema,
    outputSchema: PersonalizedMusicalThemeGenerationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
