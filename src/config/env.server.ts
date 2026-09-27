function value(name: string): string | undefined {
  const raw = process.env[name];
  return raw?.trim() || undefined;
}

export function optionalEnv(name: string): string | undefined {
  return value(name);
}

export function requiredEnv(name: string): string {
  const result = value(name);
  if (!result) throw new Error(`Missing required server environment variable: ${name}`);
  return result;
}

export function booleanEnv(name: string, fallback = false): boolean {
  const raw = value(name);
  if (raw === undefined) return fallback;
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new Error(`${name} must be either true or false.`);
}
