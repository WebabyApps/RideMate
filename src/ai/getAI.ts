import 'server-only';
import { Genkit } from 'genkit';

let _ai: Genkit | undefined;

export async function getAI(): Promise<Genkit> {
  if (_ai) return _ai;

  // Dynamically import to avoid RSC/webpack shape issues.
  const { ai } = await import('genkit');
  const { googleAI } = await import('@genkit-ai/google-genai');

  _ai = ai({
    plugins: [googleAI()],
    logLevel: 'debug',
    enableTracing: true,
  });

  return _ai;
}
