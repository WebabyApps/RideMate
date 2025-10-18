'use server';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// By default, a simple AI instance is initialized.
// No need for complex getter functions.
export const ai = genkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracing: true,
});
