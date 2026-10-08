import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import { redactSecrets } from "@/lib/redact";

const Body = z.object({ config: z.string().min(10).max(20000) });

const SYSTEM = `You are a security-focused DevOps assistant for a Java Spring Boot + Spring Security + JWT + Flyway + PostgreSQL app ("MediCare").
The operator describes their deployment. Explain the SAFEST numbered steps to create the initial ADMIN account.
Rules: never ask for, invent, or print real passwords, tokens or keys; use placeholders like <ADMIN_PASSWORD>.
Prefer: secrets in the host's secret manager / env vars, BCrypt-hashed password, a one-time bootstrap (e.g. CommandLineRunner gated by env flags, or a Flyway migration that inserts only a pre-computed hash read from env), disabling the bootstrap afterwards, forcing a password change, and never committing credentials.
Tailor to the given host (e.g. Replit Secrets). Flag any risky item you notice in their config. Use Markdown, keep it under ~500 words.`;

export const Route = createFileRoute("/api/admin-setup-guide")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Please describe your deployment (10–20000 characters).", { status: 400 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured.", { status: 500 });
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
        });
        let upstreamError: unknown;
        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          system: SYSTEM,
          prompt: `Deployment configuration (secrets already redacted):\n\n${redactSecrets(parsed.data.config)}`,
          abortSignal: request.signal,
          maxRetries: 0,
          onError: ({ error }) => { upstreamError = error; },
          providerOptions: {
            openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
          },
        });
        void upstreamError;
        return result.toTextStreamResponse();
      },
    },
  },
});
