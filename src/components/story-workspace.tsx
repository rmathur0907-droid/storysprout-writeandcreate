import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Download, Lightbulb, LockKeyhole, Pause, Shuffle, Sparkles, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DrawIllustration, WriteIllustration, SproutMascot } from '@/components/story-illustrations';
import { StoryCanvas } from '@/components/story-canvas';
import { genres } from '@/lib/story-genres';
import { adventureStep, continueStory } from '@/lib/story-ai.functions';
import { StoryNarrator } from '@/components/story-narrator';

type Choice = { emoji: string; label: string };
type Section = { choice: string; text: string };

export function StoryWorkspace({ onStep }: { onStep: (step: number) => void }) {
  const [genreIndex, setGenreIndex] = useState(0);
  const genre = genres[genreIndex] ?? genres[0];
  const [mode, setMode] = useState<'choose' | 'draw' | 'write'>('choose');
  const [step, setStep] = useState(1);
  const [idea, setIdea] = useState('');
  const [opening, setOpening] = useState('');
  const [story, setStory] = useState('');
  const [title, setTitle] = useState('My little adventure');
  const [speaking, setSpeaking] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [suggestion, setSuggestion] = useState(false);
  const [growing, setGrowing] = useState(false);
  const [growError, setGrowError] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [choicesAreEndings, setChoicesAreEndings] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [ending, setEnding] = useState<Section | null>(null);
  const [writeOwn, setWriteOwn] = useState(false);
  const [adventuring, setAdventuring] = useState(false);
  const [adventureError, setAdventureError] = useState('');
  const fullStory = [opening, ...sections.map(s => s.text), ending?.text ?? '', story.trim()].filter(Boolean).join('\n\n');
  const words = story.trim() ? story.trim().split(/\s+/).length : 0;
  useEffect(() => { setSpeechAvailable('speechSynthesis' in window); return () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }; }, []);
  function go(next: number) { setStep(next); onStep(next); }
  async function grow() {
    const seed = idea.trim(); if (!seed || growing) return;
    setGrowing(true); setGrowError('');
    try {
      const r = await continueStory({ data: { idea: seed, genre: genre.name, direction: genre.direction } });
      if (r.error || !r.text) { setGrowError(r.error ?? 'Please try again.'); return; }
      const open = `${seed}${/[.!?"”]$/.test(seed) ? '' : '.'}\n\n${r.text}`;
      setOpening(open); setSections([]); setEnding(null); setChoices([]); setChoicesAreEndings(false); setSelected(null); setWriteOwn(false); go(2);
      void runAdventure('choices', open, []);
    } catch { setGrowError('Sprout couldn’t reach the story garden. Check your connection and try again.'); }
    finally { setGrowing(false); }
  }
  async function runAdventure(mode: 'choices' | 'continue' | 'endings' | 'finish', open = opening, prev = sections, choice?: string) {
    setAdventuring(true); setAdventureError('');
    try {
      const r = await adventureStep({ data: { opening: open, sections: prev, choice, mode, genre: genre.name, direction: genre.direction } });
      if (r.error) { setAdventureError(r.error); return; }
      if (mode === 'finish') { setEnding({ choice: choice ?? '', text: r.text ?? '' }); setChoices([]); }
      else {
        if (mode !== 'choices' && r.text) setSections([...prev, { choice: choice ?? '', text: r.text }]);
        setChoices(r.choices); setChoicesAreEndings(mode === 'endings');
      }
      setSelected(null);
    } catch { setAdventureError('Sprout couldn’t reach the story garden. Check your connection and try again.'); }
    finally { setAdventuring(false); }
  }
  function continueWithChoice() {
    const c = selected !== null ? choices[selected] : undefined; if (!c || adventuring) return;
    const label = `${c.emoji} ${c.label}`;
    void runAdventure(choicesAreEndings ? 'finish' : sections.length >= 2 ? 'endings' : 'continue', opening, sections, label);
  }
  function read() {
    if (!speechAvailable) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(`${title}. ${opening} ${story}`);
    utterance.rate = 0.88; utterance.onend = () => setSpeaking(false); utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance); setSpeaking(true);
  }
  function download() {
    const blob = new Blob([`${title}\n${genre.name} · A StorySprout story\n\n${fullStory}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'my-storysprout-story.txt'; link.click(); URL.revokeObjectURL(url);
  }
  function restart() {
    if (!window.confirm('Start a new story? Download this one first if you want to keep it.')) return;
    if (speechAvailable) window.speechSynthesis.cancel();
    setSpeaking(false); setIdea(''); setStory(''); setSections([]); setEnding(null); setChoices([]); setWriteOwn(false); setMode('choose'); setSuggestion(false); go(1);
  }
  return <section className="workspace" id="story-workspace" aria-labelledby="workspace-title">
    <div className="workspace-main">
      <div className="workspace-heading"><div><span className="eyebrow">{step === 3 ? 'LOOK WHAT YOU GREW' : 'YOUR STORY STARTS HERE'}</span><h2 id="workspace-title">{step === 1 ? 'What’s your little spark?' : step === 2 ? 'Let your imagination grow.' : 'A story only you could tell.'}</h2></div><span className="step-label">Step {step} of 3</span></div>
      <p className="workspace-subtitle">{step === 1 ? 'There’s no right way to start. Just your way.' : step === 2 ? 'A little beginning. The rest is all you.' : 'Every adventure starts with a little idea. This one was yours.'}</p>
      {step === 1 && <>
        <div className="genre-section"><div className="genre-heading"><Sparkles size={13} /><span>WHAT KIND OF ADVENTURE?</span></div><div className="genre-options" role="group" aria-label="Story genre">{genres.map((g, i) => <Button key={g.name} variant="genre" aria-pressed={genreIndex === i} onClick={() => { setGenreIndex(i); setSuggestion(false); }}><span aria-hidden="true">{g.emoji}</span>{g.name}{genreIndex === i && <Check className="genre-check" />}</Button>)}</div></div>
        {mode === 'choose' ? <div className="idea-cards">
          <Button variant="idea" className="draw-card" onClick={() => setMode('draw')}><span className="card-top-label">LET YOUR PENCIL WANDER</span><DrawIllustration /><span className="card-bottom"><span><strong>Draw an idea</strong><small>A little doodle. Endless possibilities.</small></span><span className="card-arrow"><ArrowRight /></span></span></Button>
          <Button variant="idea" className="write-card" onClick={() => setMode('write')}><span className="card-top-label">LET YOUR WORDS WANDER</span><WriteIllustration /><span className="card-bottom"><span><strong>Write a beginning</strong><small>A few words can open a whole world.</small></span><span className="card-arrow"><ArrowRight /></span></span></Button>
        </div> : <div className="idea-editor"><div className="editor-heading"><Button variant="navigation" onClick={() => setMode('choose')}><ArrowLeft />Back</Button><span>{mode === 'draw' ? 'A world from your pencil' : 'A world from your words'}</span></div>{mode === 'draw' && <StoryCanvas />}<label htmlFor="story-idea">{mode === 'draw' ? 'Tell Sprout a little about your drawing' : 'Tell us your idea'}</label><textarea id="story-idea" value={idea} maxLength={1000} onChange={e => { setIdea(e.target.value); setGrowError(''); }} placeholder={genre.prompt} rows={3} /><div className="editor-footer"><small>{idea.length}/1,000</small><Button variant="story" disabled={!idea.trim() || growing} aria-busy={growing} onClick={grow}>{growing ? <><Sparkles className="animate-pulse" />Sprout is growing your idea…</> : <>Grow my story<ArrowRight /></>}</Button></div>{growError && <p className="nudge" role="alert">{growError}</p>}</div>}
        <div className="surprise-row"><span>Not sure where to start?</span><Button variant="navigation" onClick={() => { const pool = genres.filter(g => g.direction); setIdea(genre.direction ? genre.prompt : (pool[Math.floor(Math.random() * pool.length)] ?? genres[0]).prompt); setMode('write'); }}><Shuffle />Surprise me with an idea<ArrowRight /></Button></div>
      </>}
      {step === 2 && <div className="story-editor"><span className="story-genre"><span aria-hidden="true">{genre.emoji}</span>{genre.name}</span><label htmlFor="story-title">Story title</label><input id="story-title" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
        <div className="opening"><span className="eyebrow">YOUR SPARK + A LITTLE HELP FROM SPROUT</span><p>{opening}</p></div>
        {sections.map((s, i) => <div key={i} className="opening story-section"><span className="eyebrow">YOU CHOSE: {s.choice}</span><p>{s.text}</p></div>)}
        {ending && <div className="opening story-section"><span className="eyebrow">YOUR ENDING: {ending.choice}</span><p>{ending.text}</p></div>}
        {!ending && !writeOwn && <div className="choices-section"><h3>{choicesAreEndings ? 'How should it end?' : 'What happens next?'}</h3><p>{choicesAreEndings ? 'Pick the ending that feels just right for your story.' : 'Choose your adventure! You decide how the story continues.'}</p>
          {adventuring && choices.length === 0 ? <p className="nudge" aria-live="polite"><Sparkles size={12} className="inline animate-pulse" /> Sprout is dreaming up ideas…</p> : <div className="choice-grid" role="radiogroup" aria-label="Story choices">{choices.map((c, i) => <Button key={i} variant="idea" role="radio" aria-checked={selected === i} disabled={adventuring} className={`choice-card ${selected === i ? 'selected' : ''}`} onClick={() => setSelected(i)}><span className="choice-letter">{String.fromCharCode(65 + i)}</span><span className="choice-emoji" aria-hidden="true">{c.emoji}</span><span className="choice-label">{c.label}</span>{selected === i && <Check className="choice-check" />}</Button>)}</div>}
          {adventureError && <p className="nudge" role="alert">{adventureError} <Button variant="navigation" onClick={() => choices.length ? continueWithChoice() : void runAdventure('choices')}>Try again</Button></p>}
          <div className="editor-footer"><Button variant="navigation" onClick={() => setWriteOwn(true)}><Lightbulb />Continue Writing Myself</Button><Button variant="story" disabled={selected === null || adventuring} aria-busy={adventuring} onClick={continueWithChoice}>{adventuring && choices.length ? <><Sparkles className="animate-pulse" />Sprout is writing…</> : <>{choicesAreEndings ? 'Finish my story' : 'Continue the adventure'}<ArrowRight /></>}</Button></div></div>}
        {(writeOwn || ending) && <><label htmlFor="story-continuation">{ending ? 'Want to add anything of your own? (optional)' : 'What happens next?'}</label><textarea id="story-continuation" rows={8} placeholder="And then…" value={story} onChange={e => setStory(e.target.value)} maxLength={12000} /><div className="editor-footer"><small>{words} words{ending ? '' : ' · at least 20 to finish'}</small><span className="flex gap-2">{!ending && <Button variant="navigation" onClick={() => setWriteOwn(false)}>Back to choices</Button>}<Button variant="navigation" onClick={() => setSuggestion(!suggestion)}><Lightbulb />A little nudge</Button></span></div>{suggestion && <p className="nudge">{genre.question} What can your character see, hear, or feel?</p>}</>}
        <StoryNarrator text={`${title}. ${fullStory}`} />
        <div className="editor-footer"><Button variant="navigation" onClick={() => go(1)}><ArrowLeft />Back to my idea</Button><Button variant="story" disabled={!ending && words < 20} onClick={() => go(3)}>Bring my story to life<Sparkles /></Button></div></div>}
      {step === 3 && <div className="finished-story"><span className="story-genre"><span aria-hidden="true">{genre.emoji}</span>{genre.name}</span><h3>{title || 'My little adventure'}</h3><p className="story-text">{fullStory}</p><StoryNarrator text={`${title}. ${fullStory}`} /><div className="finish-actions"><Button variant="outline" onClick={download}><Download />Download story</Button></div><div className="garden"><SproutMascot /><div><h4>Your storyteller’s garden</h4><p>You grew a {genre.name.toLowerCase()} story with {sections.length + (ending ? 1 : 0)} choices{words ? ` and ${words} words` : ''} of your own. That’s something to be proud of!</p></div></div><div className="editor-footer"><Button variant="navigation" onClick={() => { if (speechAvailable) window.speechSynthesis.cancel(); setSpeaking(false); go(2); }}><ArrowLeft />Keep writing</Button><Button variant="navigation" onClick={restart}>Start a New Story<ArrowRight /></Button></div></div>}
      <p className="session-note"><LockKeyhole size={12} />Just this session. Download your finished story to keep it.</p>
    </div>
    <aside className="coach-panel" aria-label="Your writing buddy"><span className="coach-badge"><span />YOUR STORY SIDEKICK</span><SproutMascot /><h3>Hi, I’m Sprout!</h3><p>Your little writing buddy. I’ll bring a spark, ask good questions, and cheer you on.</p><div className="coach-reminder"><span className="eyebrow"><Lightbulb size={14} />SPROUT’S LITTLE REMINDER</span><blockquote>{step === 1 ? 'Your story doesn’t have to be perfect. It just has to be yours.' : step === 2 ? genre.question : 'You made something that didn’t exist before. Keep imagining!'}</blockquote></div><div className="coach-bottom"><BookOpen size={14} /><span>I’m a coach, not the author.<br />That part is all you.</span></div></aside>
  </section>;
}