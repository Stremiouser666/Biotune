'use server';
/**
 * @fileOverview A Genkit flow for interpreting live biometric data (microphone input for breathing, device motion for movement)
 * and transforming it into evolving, harmonically coherent musical elements.
 *
 * - dynamicBiometricMusicGeneration - A function that processes biometric data to generate musical parameters.
 * - DynamicBiometricMusicInput - The input type for the dynamicBiometricMusicGeneration function.
 * - DynamicBiometricMusicOutput - The return type for the dynamicBiometricMusicGeneration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema: Biometric data from client
const DynamicBiometricMusicInputSchema = z.object({
  breathingIntensity: z.number().min(0).max(1).describe('Normalized intensity of breathing detected from microphone (0.0 to 1.0). Higher values mean deeper/faster breathing. This directly influences ambience.'),
  movementIntensity: z.number().min(0).max(1).describe('Normalized intensity or suddenness of device movement (0.0 to 1.0). Higher values mean more pronounced movement. This directly influences drum triggers.'),
});
export type DynamicBiometricMusicInput = z.infer<typeof DynamicBiometricMusicInputSchema>;

// Output Schema: Musical parameters for client-side music engine
const DynamicBiometricMusicOutputSchema = z.object({
  ambienceVolume: z.number().min(0).max(1).describe('Suggested volume for ambient pads (0.0 to 1.0). Higher breathing intensity should lead to higher ambience volume.'),
  ambienceTexture: z.enum(['smooth', 'evolving', 'pulsating', 'swirling']).describe('Suggested texture for ambient pads. "smooth" for calm breathing, "evolving" or "pulsating" for moderate breathing, "swirling" for intense breathing.'),
  drumTriggerType: z.enum(['none', 'soft_tap', 'hard_hit', 'roll']).describe('Type of drum trigger based on movement intensity. "none" if no significant movement, "soft_tap" for gentle movement, "hard_hit" for sudden impact, "roll" for continuous vigorous movement.'),
  musicalMood: z.enum(['calm', 'meditative', 'energetic', 'playful', 'mysterious']).describe('Overall musical mood suggested by the biometric inputs, influencing melodic and harmonic choices. A combination of low intensities suggests "calm" or "meditative", while high intensities suggest "energetic" or "playful".'),
  tempoInfluence: z.number().min(-0.5).max(0.5).describe('A relative influence on the current tempo, where 0 means no change, positive values increase tempo, and negative values decrease it. Influenced by the overall intensity of both breathing and movement.'),
});
export type DynamicBiometricMusicOutput = z.infer<typeof DynamicBiometricMusicOutputSchema>;

// Wrapper function to call the Genkit flow
export async function dynamicBiometricMusicGeneration(input: DynamicBiometricMusicInput): Promise<DynamicBiometricMusicOutput> {
  return dynamicBiometricMusicGenerationFlow(input);
}

// Define the Genkit prompt
const dynamicBiometricMusicPrompt = ai.definePrompt({
  name: 'dynamicBiometricMusicPrompt',
  input: {schema: DynamicBiometricMusicInputSchema},
  output: {schema: DynamicBiometricMusicOutputSchema},
  prompt: `You are an AI composer specializing in translating human biometric data into harmonically coherent and evolving musical parameters. Your goal is to create a personalized soundtrack that feels directly connected to the user's physical state.\n\nBased on the user's current biometric inputs:\n- 'breathingIntensity': {{breathingIntensity}}\n- 'movementIntensity': {{movementIntensity}}\n\nInterpret these values to determine the following musical outputs:\n\n1.  **Ambience Volume (ambienceVolume)**:\n    - If 'breathingIntensity' is very low (e.g., 0.0-0.2), set 'ambienceVolume' to a low value (e.g., 0.1-0.3).\n    - If 'breathingIntensity' is moderate (e.g., 0.3-0.7), set 'ambienceVolume' to a moderate value (e.g., 0.4-0.7).\n    - If 'breathingIntensity' is high (e.g., 0.8-1.0), set 'ambienceVolume' to a high value (e.g., 0.8-1.0).\n\n2.  **Ambience Texture (ambienceTexture)**:\n    - If 'breathingIntensity' is low, suggest "smooth".\n    - If 'breathingIntensity' is moderate, suggest "evolving" or "pulsating".\n    - If 'breathingIntensity' is high, suggest "swirling".\n\n3.  **Drum Trigger Type (drumTriggerType)**:\n    - If 'movementIntensity' is very low (e.g., 0.0-0.1), suggest "none".\n    - If 'movementIntensity' is low to moderate (e.g., 0.1-0.4), suggest "soft_tap".\n    - If 'movementIntensity' is moderate to high (e.g., 0.5-0.7), suggest "hard_hit".\n    - If 'movementIntensity' is very high or sustained (e.g., 0.8-1.0), suggest "roll".\n\n4.  **Musical Mood (musicalMood)**:\n    - If both 'breathingIntensity' and 'movementIntensity' are low, suggest "calm" or "meditative".\n    - If 'breathingIntensity' is moderate and 'movementIntensity' is low, suggest "mysterious".\n    - If both are moderate, suggest "playful".\n    - If both are high, suggest "energetic".\n\n5.  **Tempo Influence (tempoInfluence)**:\n    - Calculate an average intensity: ({{breathingIntensity}} + {{movementIntensity}}) / 2.\n    - If average intensity is low (e.g., 0.0-0.3), suggest a negative tempo influence (e.g., -0.2 to -0.5) for a slower feel.\n    - If average intensity is moderate (e.g., 0.4-0.6), suggest a neutral tempo influence (e.g., -0.1 to 0.1).\n    - If average intensity is high (e.g., 0.7-1.0), suggest a positive tempo influence (e.g., 0.2 to 0.5) for a faster feel.\n\nEnsure the generated parameters always result in a musical and coherent output, where the user feels influenced but not entirely controlled. Avoid sudden drastic changes unless inputs are extreme. Output ONLY the JSON object.
`,
});

// Define the Genkit flow
const dynamicBiometricMusicGenerationFlow = ai.defineFlow(
  {
    name: 'dynamicBiometricMusicGenerationFlow',
    inputSchema: DynamicBiometricMusicInputSchema,
    outputSchema: DynamicBiometricMusicOutputSchema,
  },
  async (input) => {
    const {output} = await dynamicBiometricMusicPrompt(input);
    return output!;
  }
);
