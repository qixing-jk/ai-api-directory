"use client";

import "./globals.css";
import { Button } from "~/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background text-foreground">
        <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-16">
          <h1 className="text-3xl font-semibold tracking-tight">
            This page cannot be displayed
          </h1>
          <p className="mt-3 text-muted-foreground">
            Please try again. If the problem continues, return later.
          </p>
          <div className="mt-6">
            <Button type="button" onClick={reset}>
              Try again
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
