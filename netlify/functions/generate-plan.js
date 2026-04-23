/**
 * Netlify Function: generate-plan
 *
 * Securely proxies a household-plan generation request to the Anthropic API.
 * The frontend sends the homeowner's notes, standing duties, and recent plan
 * summaries; this function builds the structured prompt server-side and
 * returns the parsed JSON plan.
 *
 * Required environment variable:
 *   ANTHROPIC_API_KEY — set in Netlify site settings → Environment variables
 */

const JOB_CONTEXT = `
ROLE: Part-time Household Manager for a Spokane, WA family. Works Tuesdays and Thursdays.

CORE RESPONSIBILITIES (per shift):
- Full home reset (tidy, surfaces, organization)
- Dishwasher load/unload, kitchen cleanliness
- Laundry: gather, coordinate Poplin pickup, fold, put away, wash linens/towels/rags
- Kitchen/pantry: prep ~6 coffee liners with grounds weekly, restock from backups, maintain grocery list, clean fridge
- Errands: returns to UPS/Post Office, light errands
- Seasonal/activity support (sports gear, school events)
- Rotating: pantry/fridge/laundry organization, efficiency improvements
- Occasional deep cleaning, organizing projects, light outdoor maintenance

PRIORITY TRAITS: proactive, consistent, efficient, calm. Self-directed.
`.trim();

const SEASONAL_HINTS = `
SPOKANE SEASONAL CONTEXT:
- Nov–Mar: cold/snow prep (entry mats, salt, snow gear staging), indoor org projects, holiday prep, fire-safety check
- Apr–May: spring reset, deep clean, yard wakeup, swap winter→spring wardrobes, allergy-season filter changes
- Jun–Sep: outdoor maintenance, garden, grill area, summer wardrobe, beach/lake gear staging, school-out routines
- Oct: leaf cleanup, fall décor, winter prep beginning (gutters, hose drain), school-year settle-in
`.trim();

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return jsonRes(405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonRes(500, { error: 'Server missing ANTHROPIC_API_KEY environment variable' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return jsonRes(400, { error: 'Invalid JSON in request body' }); }

  const { weekDate, userNotes, standingDuties, recentPlans } = body;
  if (!weekDate || !standingDuties || !standingDuties.tuesday || !standingDuties.thursday) {
    return jsonRes(400, { error: 'Missing required fields: weekDate, standingDuties.tuesday, standingDuties.thursday' });
  }

  const prompt = buildPrompt({ weekDate, userNotes, standingDuties, recentPlans });

  let aiResp;
  try {
    aiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
  } catch (e) {
    return jsonRes(502, { error: 'Failed to reach Anthropic API', detail: e.message });
  }

  const rawText = await aiResp.text();
  let aiData;
  try { aiData = JSON.parse(rawText); }
  catch {
    return jsonRes(502, { error: 'Anthropic returned non-JSON response', detail: rawText.slice(0, 600) });
  }

  if (!aiResp.ok) {
    return jsonRes(aiResp.status, {
      error: 'Anthropic API error',
      detail: (aiData.error && aiData.error.message) || JSON.stringify(aiData).slice(0, 600)
    });
  }

  let text = '';
  if (Array.isArray(aiData.content)) {
    for (const block of aiData.content) {
      if (block && block.type === 'text' && typeof block.text === 'string') {
        text += block.text;
      }
    }
  }
  if (!text.trim()) {
    return jsonRes(502, { error: 'Empty AI response', detail: JSON.stringify(aiData).slice(0, 600) });
  }

  text = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  if (!text.startsWith('{')) {
    const s = text.indexOf('{');
    const e = text.lastIndexOf('}');
    if (s >= 0 && e > s) text = text.slice(s, e + 1);
  }

  let parsed;
  try { parsed = JSON.parse(text); }
  catch (e) {
    return jsonRes(502, { error: 'Could not parse AI JSON', raw: text.slice(0, 600) });
  }

  return jsonRes(200, parsed);
};

function buildPrompt({ weekDate, userNotes, standingDuties, recentPlans }) {
  const fmtSection = s => `- ${s.heading}: ${(s.tasks || []).join('; ')}`;
  const standingTue = standingDuties.tuesday.map(fmtSection).join('\n');
  const standingThu = standingDuties.thursday.map(fmtSection).join('\n');

  const recentSummary = (recentPlans || []).slice(0, 3).map(p =>
    `Week of ${p.weekDate}: extras [${(p.extras || []).join('; ')}]`
  ).join(' | ') || 'none';

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return `You build weekly plans for the household manager described below.

${JOB_CONTEXT}

${SEASONAL_HINTS}

Today is ${today}. The plan is for the week of ${weekDate}.

STANDING DUTIES — include all of these every plan, exactly as written:
TUESDAY:
${standingTue}
THURSDAY:
${standingThu}

THIS WEEK'S NOTES FROM THE HOMEOWNER:
"""
${userNotes || '(no special notes — produce a normal week)'}
"""

RECENT PLANS (avoid repeating these extras unless still relevant):
${recentSummary}

INSTRUCTIONS:
1. Always include all standing duties, exactly. You may add 1–2 extra tasks within an existing standing section if this week's notes call for it (e.g. add "Pick up party supplies" under Errands), but never remove standing tasks.
2. Add NEW sections to Tuesday or Thursday for special week items (e.g. "Birthday Prep", "Guest Prep", "Travel Prep"). Keep section headings short and action-oriented.
3. Weekly Extras: produce 3–6 items mixing (a) seasonal Spokane suggestions appropriate for this time of year, (b) projects called out in this week's notes, (c) gentle organizational improvements. Avoid repeating recent extras.
4. Be specific and actionable. Short, clear task wording. No fluff or filler.
5. For each tile (Tuesday, Thursday, Weekly Extras), optionally write a brief 1-sentence helper note for the Notes area — only if genuinely useful (e.g. "Poplin holiday schedule may shift this week — confirm pickup day.").

OUTPUT:
Respond with ONLY this JSON, no markdown fences, no preamble, no explanation:

{
  "tuesday": {
    "subtitle": "Reset + Plan Day",
    "sections": [{"heading": "...", "tasks": ["..."]}],
    "notes": ""
  },
  "thursday": {
    "subtitle": "Maintain + Prep Day",
    "sections": [{"heading": "...", "tasks": ["..."]}],
    "notes": ""
  },
  "weeklyExtras": {
    "items": ["..."],
    "notes": ""
  }
}`;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function jsonRes(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    body: JSON.stringify(obj)
  };
}
