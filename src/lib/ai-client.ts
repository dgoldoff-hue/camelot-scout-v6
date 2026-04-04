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

Camelot Realty Group is a NYC-based property management firm led by David Goldoff. They specialize in co-ops, condos, and residential buildings. Their competitive advantages include personal attention, weekly inspections, ConciergePlus technology, transparent financials, compliance expertise, and zero bank fees.

The team includes: David Goldoff (Owner/Principal), Sam Lodge (Tech Lead), Carl (Cold Caller), Luigi (Operations), Jake, Valerie, Spencer, Danielle, and Merlin (Tech Lead/AI).

Be concise, data-driven, and actionable. Use specific numbers when available. Format responses with markdown for readability.`;

/**
 * Check if AI is configured (external API)
 */
export function isAIConfigured(): boolean {
  return !!(getAIConfig().apiUrl && getAIConfig().apiKey);
}

/**
 * Local query engine — handles quick actions without an external AI API.
 * Returns null if the query doesn't match a known local command.
 */
export function localQueryEngine(
  query: string,
  buildings: { 
    address: string; name?: string; score: number; grade: string; 
    pipeline_stage: string; pipeline_moved_at?: string; status: string;
    units?: number; violations_count: number; open_violations_count: number;
    current_management?: string; contacts: { name: string; role: string; email?: string; phone?: string }[];
    borough?: string; region?: string; type: string;
  }[]
): string | null {
  const q = query.toLowerCase();
  const active = buildings.filter((b) => b.status === 'active');

  // Pipeline Summary
  if (q.includes('pipeline') && (q.includes('summary') || q.includes('status') || q.includes('how many'))) {
    const byStage: Record<string, number> = {};
    active.forEach((b) => { byStage[b.pipeline_stage] = (byStage[b.pipeline_stage] || 0) + 1; });
    const avgScore = active.length ? Math.round(active.reduce((s, b) => s + b.score, 0) / active.length) : 0;
    const totalUnits = active.reduce((s, b) => s + (b.units || 0), 0);
    const totalOpenViol = active.reduce((s, b) => s + (b.open_violations_count || 0), 0);

    let resp = `## 📊 Pipeline Summary\n\n`;
    resp += `**${active.length} active buildings** across ${Object.keys(byStage).length} pipeline stages:\n\n`;
    const stageOrder = ['discovered', 'scored', 'contacted', 'nurture', 'proposal', 'negotiation', 'won', 'lost'];
    stageOrder.forEach((s) => {
      if (byStage[s]) resp += `- **${s.charAt(0).toUpperCase() + s.slice(1)}:** ${byStage[s]} buildings\n`;
    });
    resp += `\n**Key Metrics:**\n`;
    resp += `- Average Score: **${avgScore}/100**\n`;
    resp += `- Total Units: **${totalUnits.toLocaleString()}**\n`;
    resp += `- Open Violations: **${totalOpenViol}**\n\n`;

    const gradeA = active.filter((b) => b.grade === 'A').length;
    const gradeB = active.filter((b) => b.grade === 'B').length;
    resp += `**Grade Distribution:** A: ${gradeA}, B: ${gradeB}, C: ${active.length - gradeA - gradeB}\n\n`;

    // Recommendations
    const discovered = active.filter((b) => b.pipeline_stage === 'discovered');
    if (discovered.length > 0) {
      resp += `💡 **Action Item:** ${discovered.length} buildings still in "Discovered" — review and score them to move the pipeline forward.`;
    }
    return resp;
  }

  // Top Leads
  if (q.includes('top') && (q.includes('lead') || q.includes('build') || q.includes('score'))) {
    const countMatch = q.match(/top\s+(\d+)/);
    const count = countMatch ? Math.min(parseInt(countMatch[1]), 20) : 10;
    const sorted = [...active].sort((a, b) => b.score - a.score).slice(0, count);

    let resp = `## 🎯 Top ${sorted.length} Leads by Score\n\n`;
    sorted.forEach((b, i) => {
      resp += `**${i + 1}. ${b.name || b.address}** — Score: **${b.score}** (Grade ${b.grade})\n`;
      resp += `   📍 ${b.address}${b.borough ? ' • ' + b.borough : ''}\n`;
      resp += `   🏢 ${b.units || '?'} units • ${b.type} • Stage: ${b.pipeline_stage}\n`;
      resp += `   ⚠️ ${b.open_violations_count} open / ${b.violations_count} total violations\n`;
      resp += `   🏗️ Mgmt: ${b.current_management || 'Unknown'}\n`;
      if (b.contacts?.length > 0) {
        resp += `   👤 ${b.contacts[0].name} (${b.contacts[0].role})${b.contacts[0].email ? ' — ' + b.contacts[0].email : ''}\n`;
      }
      resp += `\n`;
    });
    return resp;
  }

  // Draft Email
  if (q.includes('draft') && q.includes('email')) {
    // Find the building: either named in query or highest-scored untouched one
    let target = active.find((b) => {
      const bName = (b.name || '').toLowerCase();
      const bAddr = b.address.toLowerCase();
      return q.includes(bName) || q.includes(bAddr);
    });
    if (!target) {
      // Highest-scored building not yet contacted
      target = [...active]
        .filter((b) => b.pipeline_stage === 'discovered' || b.pipeline_stage === 'scored')
        .sort((a, b) => b.score - a.score)[0] || active[0];
    }
    if (!target) return 'No buildings in the database to draft an email for.';

    const contact = target.contacts?.[0];
    const contactName = contact?.name || 'Board Member';

    let resp = `## ✉️ Draft Email for ${target.name || target.address}\n\n`;
    resp += `**To:** ${contact?.email || '(no email on file)'}\n`;
    resp += `**Subject:** Property Management Services for ${target.name || target.address}\n\n`;
    resp += `---\n\n`;
    resp += `Dear ${contactName},\n\n`;
    resp += `My name is David Goldoff, and I'm the principal of Camelot Realty Group. I'm reaching out because I noticed ${target.name || target.address} at ${target.address} — a ${target.units || ''}-unit ${target.type} in ${target.borough || 'NYC'} — and I believe we can provide exceptional management services for your property.\n\n`;
    if (target.open_violations_count > 0) {
      resp += `With ${target.open_violations_count} open HPD violations on record, I understand the challenges of maintaining a well-run building. At Camelot, we take a hands-on approach with weekly inspections and proactive violation resolution.\n\n`;
    }
    resp += `Our key differentiators:\n`;
    resp += `• **Personal Attention** — I personally oversee every property\n`;
    resp += `• **Weekly Inspections** — On-site walkthroughs to catch issues early\n`;
    resp += `• **Zero Bank Fees** — Your money works for your building\n`;
    resp += `• **Transparent Financials** — Real-time budget tracking\n\n`;
    resp += `I'd love to schedule a 15-minute call to discuss how Camelot can serve ${target.name || target.address}. Would this week work?\n\n`;
    resp += `Best regards,\n`;
    resp += `David Goldoff\n`;
    resp += `Principal, Camelot Realty Group\n`;
    resp += `477 Madison Avenue, 6th Fl, New York, NY 10022\n`;
    resp += `dgoldoff@camelot.nyc\n\n`;
    resp += `---\n*You can copy this email or go to **Outreach → Compose** to customize it further.*`;
    return resp;
  }

  // Untouched Leads
  if (q.includes('untouched') || (q.includes('discovered') && (q.includes('no') || q.includes('without') || q.includes('contact')))) {
    const untouched = active.filter((b) => b.pipeline_stage === 'discovered');
    if (untouched.length === 0) return '✅ No untouched leads — every building has been moved past the "Discovered" stage.';

    const sorted = [...untouched].sort((a, b) => b.score - a.score);
    let resp = `## 🔍 Untouched Leads (${sorted.length} buildings in "Discovered")\n\n`;
    resp += `These buildings haven't been scored or contacted yet:\n\n`;
    sorted.forEach((b, i) => {
      const daysSince = b.pipeline_moved_at
        ? Math.floor((Date.now() - new Date(b.pipeline_moved_at).getTime()) / 86400000)
        : 0;
      resp += `**${i + 1}. ${b.name || b.address}** — Score: ${b.score}, Grade ${b.grade}\n`;
      resp += `   ${b.address} • ${b.units || '?'} units • ${b.open_violations_count} open violations\n`;
      resp += `   In "Discovered" for **${daysSince} day${daysSince !== 1 ? 's' : ''}**\n`;
      if (b.contacts?.length > 0) {
        resp += `   Contact: ${b.contacts[0].name} (${b.contacts[0].role})\n`;
      } else {
        resp += `   ⚠️ No contacts on file — consider enrichment\n`;
      }
      resp += `\n`;
    });
    resp += `💡 **Recommendation:** Start with the highest-scored buildings and enrich contacts where missing.`;
    return resp;
  }

  // Competitive analysis
  if (q.includes('competitive') || q.includes('competition') || q.includes('landscape')) {
    const mgmtCounts: Record<string, number> = {};
    active.forEach((b) => {
      const mgmt = b.current_management || 'Unknown';
      mgmtCounts[mgmt] = (mgmtCounts[mgmt] || 0) + 1;
    });
    const sorted = Object.entries(mgmtCounts).sort(([, a], [, b]) => b - a);

    let resp = `## 🏢 Competitive Landscape (from Scout database)\n\n`;
    resp += `**Management companies across ${active.length} tracked buildings:**\n\n`;
    sorted.forEach(([mgmt, count]) => {
      resp += `- **${mgmt}:** ${count} building${count > 1 ? 's' : ''}\n`;
    });
    resp += `\n**Key observations:**\n`;
    const selfManaged = active.filter((b) => b.current_management?.toLowerCase().includes('self') || b.current_management?.toLowerCase() === 'unknown').length;
    resp += `- ${selfManaged} buildings are self-managed or have unknown management — prime targets\n`;
    resp += `- Focus outreach on buildings with high violation counts + weak management\n\n`;
    resp += `*For deeper competitive intel, configure the AI backend in Settings.*`;
    return resp;
  }

  // No match — return null (will show fallback message)
  return null;
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
