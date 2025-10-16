'server-only';

import { ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// This instance does NOT include the Next.js plugin and is safe for server-side use.
export const genkit = ai({
  plugins: [
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracing: true,
});
