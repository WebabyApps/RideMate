import { ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { nextPlugin } from '@genkit-ai/next';

export const genkit = ai({
  plugins: [
    googleAI(),
    nextPlugin(),
  ],
  logLevel: 'debug',
  enableTracing: true,
});
