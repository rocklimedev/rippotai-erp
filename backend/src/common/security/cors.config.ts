// Shared browser origin policy for HTTP and Socket.IO, with or without Redis.
export const APPROVED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://vendors-quote.rippotaiarchitecture.com',
  'https://rippotai-erp-qga2.vercel.app',
  'https://inos.rippotaiarchitecture.com',
];

export function getCorsOptions() {
  return { origin: [...APPROVED_ORIGINS], credentials: true };
}
