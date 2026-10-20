export function logServerError(context: string, error: unknown) {
  const message =
    error instanceof Error ? error.message : "kesalahan tidak dikenal";
  console.error(`[agendakita] ${context}: ${message}`);

  if (error instanceof Error && process.env.NODE_ENV !== "production") {
    console.error(error.stack);
  }
}
