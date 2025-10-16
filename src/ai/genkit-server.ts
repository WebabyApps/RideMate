import {genkit, type Genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// This instance does NOT include the Next.js plugin and is safe for server-side use.
export const ai: Genkit = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
  enableTracing: true,
  logLevel: 'debug',
});
