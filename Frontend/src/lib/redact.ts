/** Strips likely secrets (passwords, tokens, keys, connection-string credentials) before text leaves the browser or reaches the AI. */
export function redactSecrets(input: string): string {
  return input
    .replace(/(\b[\w.-]*(pass(word)?|pwd|secret|token|api[_-]?key|private[_-]?key|jwt)[\w.-]*\s*[:=]\s*)("[^"]*"|'[^']*'|\S+)/gi, "$1[REDACTED]")
    .replace(/(\w+:\/\/[^:\s/]+:)[^@\s]+@/g, "$1[REDACTED]@")
    .replace(/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/g, "[REDACTED_HASH]")
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[REDACTED_JWT]")
    .replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g, "[REDACTED_KEY]");
}
