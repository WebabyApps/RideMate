'server-only';

import { configure } from '@genkit-ai/ai';
import { googleCloud } from '@genkit-ai/google-cloud';

// This instance does NOT include the Next.js plugin and is safe for server-side use.
export const ai = configure({
  plugins: [
    googleCloud(),
  ],
  logLevel: 'debug',
  enableTracing: true,
});
