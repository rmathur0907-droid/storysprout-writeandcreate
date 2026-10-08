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

export const continueStory = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ idea: z.string().trim().min(1).max(1000), genre: z.string().max(60), direction: z.string().max(300) }).parse(d))
  .handler(async ({ data }) => {
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) return { text: null, error: 'Sprout is resting right now. Please try again soon.' };
    const genreLine = data.direction
      ? `Selected genre: ${data.genre}. Use it only as a light creative direction: ${data.direction} The child's beginning always comes first.`
      : `Selected genre: Let's Imagine (open-ended). Do not push the story toward any genre. Simply follow the child's imagination.`;
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'google/gemini-3-flash-preview', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: `${genreLine}\n\nThe child's beginning:\n"""${data.idea}"""\n\nContinue from exactly here.` }] }),
    });
    if (res.status === 429) return { text: null, error: 'Sprout needs a tiny breather. Please try again in a moment.' };
    if (res.status === 402) return { text: null, error: 'Sprout’s story magic has run out for now. Please try again later.' };
    if (!res.ok) return { text: null, error: 'Sprout couldn’t grow your story just now. Please try again.' };
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content?.trim();
    return text ? { text, error: null } : { text: null, error: 'Sprout couldn’t think of a next part. Please try again.' };
  });
