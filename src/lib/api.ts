import { FunctionsHttpError } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";

/** Error from the provider-proxy Edge Function, with its HTTP status and machine code. */
export class ProxyError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "ProxyError";
  }
}

export const isInsufficientBalance = (error: unknown) =>
  error instanceof ProxyError && error.code === "insufficient_balance";

/**
 * Calls provider-proxy, the same backend the mobile app uses. Provider keys,
 * model choice and billing live on the server; the client sends intent.
 */
export async function callProxy<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await getSupabase().functions.invoke("provider-proxy", {
    body: { action, payload },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const response = error.context as Response;
      const body = await response.json().catch(() => ({}));
      throw new ProxyError(body?.error ?? "Request failed", response.status, body?.code);
    }
    throw error;
  }
  return data as T;
}
