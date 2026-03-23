'use server';
/**
 * @fileOverview A flow for interpreting live biometric data (microphone input for breathing, device motion for movement)
 * and transforming it into musical parameters.
 *
 * This implementation uses local deterministic logic instead of an LLM to avoid rate limits
 * and provide instantaneous responsiveness.
 *
 * - dynamicBiometricMusicGeneration - A function that processes biometric data to generate musical parameters.
 * - DynamicBiometricMusicInput - The input type for the dynamicBiometricMusicGeneration function.
 * - DynamicBiometricMusicOutput - The return type for the dynamicBiometricMusicGeneration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema: Biometric data from client
const DynamicBiometricMusicInputSchema = z.object({
  breathingIntensity: z.number().min(0).max(1).describe('Normalized intensity of breathing detected from microphone (0.0 to 1.0).'),
  movementIntensity: z.number().min(0).max(1).describe('Normalized intensity or suddenness of device movement (0.0 to 1.0).'),
});
export type DynamicBiometricMusicInput = z.infer<typeof DynamicBiometricMusicInputSchema>;

// Output Schema: Musical parameters for client-side music engine
const DynamicBiometricMusicOutputSchema = z.object({
  ambienceVolume: z.number().min(0).max(1).describe('Suggested volume for ambient pads (0.0 to 1.0).'),
  ambienceTexture: z.enum(['smooth', 'evolving', 'pulsating', 'swirling']).describe('Suggested texture for ambient pads.'),
  drumTriggerType: z.enum(['none', 'soft_tap', 'hard_hit', 'roll']).describe('Type of drum trigger based on movement intensity.'),
  musicalMood: z.enum(['calm', 'meditative', 'energetic', 'playful', 'mysterious']).describe('Overall musical mood suggested by the biometric inputs.'),
  tempoInfluence: z.number().min(-0.5).max(0.5).describe('A relative influence on the current tempo.'),
});
export type DynamicBiometricMusicOutput = z.infer<typeof DynamicBiometricMusicOutputSchema>;

/**
 * Deterministic logic for mapping biometrics to musical parameters.
 * Replaces the previous LLM-based approach to avoid rate limits.
 */
function getBiometricParams(breathing: number, movement: number): DynamicBiometricMusicOutput {
  const avg = (breathing + movement) / 2;

  const ambienceTexture =
    breathing < 0.3 ? 'smooth' :
    breathing < 0.7 ? 'evolving' : 'swirling';

  const drumTriggerType =
    movement < 0.1 ? 'none' :
    movement < 0.4 ? 'soft_tap' :
    movement < 0.7 ? 'hard_hit' : 'roll';

  const musicalMood =
    avg < 0.3 ? 'calm' :
    avg < 0.5 ? 'meditative' :
    avg < 0.7 ? 'playful' : 'energetic';

  const tempoInfluence =
    avg < 0.3 ? -0.3 :
    avg < 0.6 ?  0.0 : 0.3;

  return {
    ambienceVolume: breathing,
    ambienceTexture: ambienceTexture as any,
    drumTriggerType: drumTriggerType as any,
    musicalMood: musicalMood as any,
    tempoInfluence,
  };
}

// Wrapper function to call the local logic (maintaining the flow interface)
export async function dynamicBiometricMusicGeneration(input: DynamicBiometricMusicInput): Promise<DynamicBiometricMusicOutput> {
  return dynamicBiometricMusicGenerationFlow(input);
}

// Define the Genkit flow using the local mapping function
const dynamicBiometricMusicGenerationFlow = ai.defineFlow(
  {
    name: 'dynamicBiometricMusicGenerationFlow',
    inputSchema: DynamicBiometricMusicInputSchema,
    outputSchema: DynamicBiometricMusicOutputSchema,
  },
  async (input) => {
    return getBiometricParams(input.breathingIntensity, input.movementIntensity);
  }
);
