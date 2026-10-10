import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const SYSTEM = `You are Sprout, a gentle creative companion for children aged 5-11. A child has written (or drawn and described) the beginning of a story. Your job is to write a short continuation (3-5 sentences, under 90 words) that continues DIRECTLY from the child's last words.
Rules:
- Carefully understand the child's beginning. Keep the exact same characters, names, setting, events, and main idea.
- Never replace the child's characters, never change the main idea, never start an unrelated story.
- Do not add unrelated new elements (spaceships, pirates, new main characters) unless the child's story gives a reason.
- Build naturally on the last thing that happened. Match the child's tone. Keep it warm and age-appropriate.
- Add small creative, sensory details, then stop at an open moment so the child can decide what happens next. Do not finish the story.
- Do not repeat the child's text. Output only the continuation prose, no title, no quotes, no commentary.`;

const CHOICE_SYSTEM = `You are Sprout, a gentle creative companion for children aged 5-11, helping them build a choose-your-adventure story.
You will receive the full story so far. Keep the same characters, names, setting, tone and continuity. Never repeat earlier text. Keep everything warm and age-appropriate.
Always reply with json only, in this shape: {"text": string, "choices": [{"emoji": string, "label": string}]}.
- "choices": 3 or 4 short (max 12 words), exciting, clearly different options for what could happen next, each growing from the story so far, each with one fitting emoji.`;

type Result = { text: string | null; choices: { emoji: string; label: string }[]; error: string | null };

async function callGateway(system: string, user: string, json: boolean): Promise<{ content?: string; error?: string }> {
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) return { error: 'Sprout is resting right now. Please try again soon.' };
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'google/gemini-3-flash-preview', ...(json ? { response_format: { type: 'json_object' } } : {}), messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
  });
  if (res.status === 429) return { error: 'Sprout needs a tiny breather. Please try again in a moment.' };
  if (res.status === 402) return { error: 'Sprout’s story magic has run out for now. Please try again later.' };
  if (!res.ok) return { error: 'Sprout couldn’t grow your story just now. Please try again.' };
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = body.choices?.[0]?.message?.content?.trim();
  return content ? { content } : { error: 'Sprout couldn’t think of a next part. Please try again.' };
}

function genreLine(genre: string, direction: string) {
  return direction
    ? `Selected genre: ${genre}. Use it only as a light creative direction: ${direction} The child's beginning always comes first.`
    : `Selected genre: Let's Imagine (open-ended). Do not push the story toward any genre. Simply follow the child's imagination.`;
}

function parseChoices(content: string, needText: boolean): Result {
  try {
    const raw = JSON.parse(content.replace(/^```(?:json)?|```$/g, '').trim()) as { text?: unknown; choices?: unknown };
    const choices = (Array.isArray(raw.choices) ? raw.choices : [])
      .map((c: { emoji?: unknown; label?: unknown }) => ({ emoji: String(c?.emoji ?? '✨').slice(0, 8), label: String(c?.label ?? '').trim().slice(0, 140) }))
      .filter(c => c.label).slice(0, 4);
    const text = typeof raw.text === 'string' ? raw.text.trim() : '';
    if (choices.length < 2 || (needText && !text)) throw new Error('bad');
    return { text: text || null, choices, error: null };
  } catch { return { text: null, choices: [], error: 'Sprout got a little muddled. Please try again.' }; }
}

export const continueStory = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ idea: z.string().trim().min(1).max(1000), genre: z.string().max(60), direction: z.string().max(300) }).parse(d))
  .handler(async ({ data }) => {
    const r = await callGateway(SYSTEM, `${genreLine(data.genre, data.direction)}\n\nThe child's beginning:\n"""${data.idea}"""\n\nContinue from exactly here.`, false);
    return r.content ? { text: r.content, error: null } : { text: null, error: r.error ?? 'Please try again.' };
  });

const sectionSchema = z.object({ choice: z.string().max(200), text: z.string().max(2000) });

/** Choose-your-adventure step. mode: 'choices' = only offer choices for the story so far; 'continue' = write the chosen direction then offer choices; 'endings' = write the chosen direction then offer endings; 'finish' = write the chosen ending. */
export const adventureStep = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({
    opening: z.string().trim().min(1).max(4000),
    sections: z.array(sectionSchema).max(8),
    choice: z.string().max(200).optional(),
    mode: z.enum(['choices', 'continue', 'endings', 'finish']),
    genre: z.string().max(60), direction: z.string().max(300),
  }).parse(d))
  .handler(async ({ data }): Promise<Result> => {
    const history = [data.opening, ...data.sections.map(s => `[The child chose: ${s.choice}]\n${s.text}`)].join('\n\n');
    const base = `${genreLine(data.genre, data.direction)}\n\nThe story so far:\n"""${history}"""\n\n`;
    if (data.mode === 'finish') {
      const r = await callGateway(SYSTEM.replace('Do not finish the story.', '').replace('then stop at an open moment so the child can decide what happens next.', ''),
        `${base}The child picked this ending: "${data.choice}". Write a warm, satisfying final part (4-6 sentences, under 110 words) that follows this ending and ties together the child's earlier choices. End the story.`, false);
      return r.content ? { text: r.content, choices: [], error: null } : { text: null, choices: [], error: r.error ?? 'Please try again.' };
    }
    const task = data.mode === 'choices'
      ? `Set "text" to "" and give choices for what happens next.`
      : `The child chose: "${data.choice}". Set "text" to the next part (3-5 sentences, under 90 words) that follows this choice directly and stops at an open moment. ${data.mode === 'endings'
        ? 'Then make "choices" 3 or 4 different possible ENDINGS (for example a happy ending, a surprising discovery, a friendship ending, an imaginative ending) that fit this specific story and the choices made.'
        : 'Then give new choices for what happens next.'}`;
    const r = await callGateway(CHOICE_SYSTEM, base + task, true);
    if (!r.content) return { text: null, choices: [], error: r.error ?? 'Please try again.' };
    return parseChoices(r.content, data.mode !== 'choices');
  });
