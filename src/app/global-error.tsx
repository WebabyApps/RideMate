'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log the error to the console for debugging.
    // This is the most important part to capture the "real" error.
    console.error('--- GLOBAL ERROR BOUNDARY CAUGHT ERROR ---');
    console.error(error);
    console.error('------------------------------------------');
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
            Something went wrong!
          </h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            An unexpected error occurred. Please try again.
          </p>
          <Button onClick={() => reset()}>
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
