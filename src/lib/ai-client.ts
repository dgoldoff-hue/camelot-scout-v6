/**
 * AI Chat Client — OpenAI-compatible API
 * Works with: OpenAI, OpenRouter, Anthropic (via proxy), local LLMs (Ollama, LM Studio), etc.
 * All configuration via environment variables. No hard dependency on any provider.
 */

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

const SCOUT_SYSTEM_PROMPT = `You are Scout AI, the intelligent assistant for Camelot Property Management's business development platform — Camelot Scout v6.

You help the Camelot team with:
- Analyzing properties and lead scores
- Drafting outreach emails for buildings
- Providing pipeline summaries and recommendations
- Suggesting next actions for leads in the pipeline
- Answering questions about NYC building data (HPD violations, DOF assessments, etc.)
- Competitive analysis of other management companies
- Generating reports and summaries

Camelot Property Management Services Corp is a NYC-based property management firm led by David Goldoff. They specialize in co-ops, condos, and residential buildings. Their competitive advantages include personal attention, weekly inspections, ConciergePlus technology, transparent financials, compliance expertise, and zero bank fees.

The team includes: David Goldoff (Owner/Principal), Sam Lodge (Tech Lead), Carl (Cold Caller), Luigi (Operations), Jake, Valerie, Spencer, Danielle, and Merlin (Tech Lead/AI).

Be concise, data-driven, and actionable. Use specific numbers when available. Format responses with markdown for readability.`;

/**
 * Check if AI is configured
 */
export function isAIConfigured(): boolean {
  return !!(getAIConfig().apiUrl && getAIConfig().apiKey);
}

/**
 * Get AI configuration from environment
 */
export function getAIConfig(): AIConfig {
  return {
    apiUrl: import.meta.env.VITE_AI_API_URL || '',
    apiKey: import.meta.env.VITE_AI_API_KEY || '',
    model: import.meta.env.VITE_AI_MODEL || 'gpt-4o',
  };
}

/**
 * Send a chat completion request to any OpenAI-compatible endpoint
 */
export async function chatCompletion(
  messages: AIChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    stream?: false;
  }
): Promise<string> {
  const config = getAIConfig();

  if (!config.apiUrl || !config.apiKey) {
    throw new Error('AI_NOT_CONFIGURED');
  }

  const body = {
    model: config.model,
    messages: [
      { role: 'system' as const, content: SCOUT_SYSTEM_PROMPT },
      ...messages,
    ],
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
    stream: false,
  };

  const res = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    if (res.status === 401 || res.status === 403) {
      throw new Error('AI_AUTH_FAILED');
    }
    if (res.status === 429) {
      throw new Error('AI_RATE_LIMITED');
    }
    throw new Error(`AI API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response generated.';
}

/**
 * Stream a chat completion (for real-time typing effect)
 */
export async function chatCompletionStream(
  messages: AIChatMessage[],
  onChunk: (text: string) => void,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const config = getAIConfig();

  if (!config.apiUrl || !config.apiKey) {
    throw new Error('AI_NOT_CONFIGURED');
  }

  const body = {
    model: config.model,
    messages: [
      { role: 'system' as const, content: SCOUT_SYSTEM_PROMPT },
      ...messages,
    ],
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
    stream: true,
  };

  const res = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    if (res.status === 401 || res.status === 403) throw new Error('AI_AUTH_FAILED');
    if (res.status === 429) throw new Error('AI_RATE_LIMITED');
    throw new Error(`AI API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6).trim();
      if (data === '[DONE]') break;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          fullText += content;
          onChunk(content);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  return fullText;
}

/**
 * Generate an email draft using AI
 */
export async function generateEmail(params: {
  buildingName: string;
  address: string;
  contactName?: string;
  contactRole?: string;
  violations?: number;
  units?: number;
  tone?: string;
}): Promise<{ subject: string; body: string }> {
  const prompt = `Draft a professional outreach email for Camelot Property Management to send to ${params.contactName || 'the board'} at ${params.buildingName} (${params.address}).
Building details: ${params.units || 'unknown'} units, ${params.violations || 0} HPD violations.
${params.contactRole ? `Contact role: ${params.contactRole}` : ''}
Tone: ${params.tone || 'professional and personal'}

Return the email in this exact format:
SUBJECT: [subject line]
BODY:
[email body]`;

  const response = await chatCompletion([{ role: 'user', content: prompt }]);

  const subjectMatch = response.match(/SUBJECT:\s*(.+)/);
  const bodyMatch = response.match(/BODY:\s*([\s\S]+)/);

  return {
    subject: subjectMatch?.[1]?.trim() || `Property Management Services for ${params.buildingName}`,
    body: bodyMatch?.[1]?.trim() || response,
  };
}

/**
 * Summarize pipeline status using AI
 */
export async function summarizePipeline(data: {
  stageCounts: Record<string, number>;
  totalBuildings: number;
  recentMoves: string[];
}): Promise<string> {
  const prompt = `Summarize this pipeline status for the Camelot team:
Total buildings: ${data.totalBuildings}
Stage counts: ${JSON.stringify(data.stageCounts)}
Recent activity: ${data.recentMoves.join('; ')}

Be brief (3-4 sentences), highlight action items.`;

  return chatCompletion([{ role: 'user', content: prompt }]);
}
