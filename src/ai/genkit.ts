import { configure } from '@genkit-ai/ai';
import { googleCloud } from '@genkit-ai/google-cloud';
import { nextPlugin } from '@genkit-ai/next';

export const ai = configure({
  plugins: [
    googleCloud(),
    nextPlugin(),
  ],
  logLevel: 'debug',
  enableTracing: true,
});
