export function getPublicApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

export async function fetchHealth(): Promise<{ status: string; timestamp: string }> {
  const base = getPublicApiUrl();
  const res = await fetch(`${base}/api/v1/health`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`);
  }
  return res.json() as Promise<{ status: string; timestamp: string }>;
}
