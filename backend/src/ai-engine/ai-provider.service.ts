import { Injectable, InternalServerErrorException } from '@nestjs/common';

const MODEL = 'claude-sonnet-4-6';

/**
 * Thin wrapper around the Anthropic Messages API for the AI Fitness Engine.
 * Requires ANTHROPIC_API_KEY in the environment (server-side only — never
 * exposed to any frontend). All prompts force strict JSON-only output so
 * `ai-engine.service.ts` can persist it directly into `AISuggestion.outputJson`.
 */
@Injectable()
export class AiProviderService {
  async generateStructuredOutput(
    systemPrompt: string,
    userPayload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('کلید سرویس هوش مصنوعی پیکربندی نشده است.');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: JSON.stringify(userPayload) }],
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        `خطا در سرویس هوش مصنوعی (${response.status}).`,
      );
    }

    const data = await response.json();
    const text = (data.content ?? [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n');

    try {
      return JSON.parse(text);
    } catch {
      throw new InternalServerErrorException(
        'پاسخ هوش مصنوعی قابل تجزیه به JSON نبود.',
      );
    }
  }
}
