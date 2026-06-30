import { createHash } from "crypto";

export function canonicalize(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj) ?? "";
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalize).join(",") + "]";
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(key => `${JSON.stringify(key)}:${canonicalize(obj[key])}`);
  return "{" + pairs.join(",") + "}";
}

export function computeHash(content: string | object): string {
  const target = typeof content === "string" ? content.trim() : canonicalize(content);
  return createHash("sha256").update(target).digest("hex");
}