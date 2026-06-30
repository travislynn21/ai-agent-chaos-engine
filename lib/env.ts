const REQUIRED_SERVER_ENV_KEYS = [
  "DATABASE_URL",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "ENGINE_VERSION",
  "PRICING_VERSION",
] as const;

export type VerifiedEnv = Record<(typeof REQUIRED_SERVER_ENV_KEYS)[number], string>;

function validateEnvironmentContract(): VerifiedEnv {
  const missingKeys: string[] = [];
  const verifiedEnv = {} as Record<string, string>;

  for (const key of REQUIRED_SERVER_ENV_KEYS) {
    const value = process.env[key];
    if (!value || value.trim().length === 0) {
      missingKeys.push(key);
    } else {
      verifiedEnv[key] = value;
    }
  }

  if (missingKeys.length > 0) {
    throw new Error(
      `CRITICAL_STARTUP_FAILURE: Missing explicit required infrastructure keys:\n` +
        missingKeys.map((key) => ` - [MISSING]: ${key}`).join("\n") +
        `\nEnsure all values are injected via deployment environment config or root .env.local/.env.test as appropriate.`
    );
  }

  return verifiedEnv as VerifiedEnv;
}

export const env = validateEnvironmentContract();