export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function getHost(): string {
  return isDevelopment()
    ? `http://localhost:3000`
    : `https://cwg-progress.vercel.app`;
}
