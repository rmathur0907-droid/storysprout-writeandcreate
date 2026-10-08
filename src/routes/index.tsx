import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, ChevronRight, Feather, Heart, Lightbulb, LockKeyhole, Moon, Pencil, ShieldCheck, Sparkles, Sprout, Star, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { StoryWorkspace } from '@/components/story-workspace';
import island from '@/assets/story-island.png.asset.json';

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: 'StorySprout — Little ideas. Big adventures.' },
    { name: 'description', content: 'Plant a story idea, choose your favorite genre, and grow an adventure of your own with StorySprout.' },
    { property: 'og:title', content: 'StorySprout — Little ideas. Big adventures.' },
    { property: 'og:description', content: 'A little spark for a story only you can tell. Draw, write, and explore six imaginative story genres.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});

function Index() {
  const [dark, setDark] = useState(false);
  const [step, setStep] = useState(1);
  const [guide, setGuide] = useState<'how' | 'grownups' | 'privacy' | null>(null);
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem('storysprout-theme'); } catch { /* Theme can work without storage. */ }
    const isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(isDark); document.documentElement.classList.toggle('dark', isDark);
  }, []);
  function toggleTheme() { const next = !dark; setDark(next); document.documentElement.classList.toggle('dark', next); try { localStorage.setItem('storysprout-theme', next ? 'dark' : 'light'); } catch { /* Session theme still applies. */ } }
  function create() { document.getElementById('story-workspace')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
  return <div className="site-shell">
    <header className="site-header"><a className="wordmark" href="/" aria-label="StorySprout home"><Sprout className="brand-icon" />Story<span className="brand-green">Sprout</span><span className="brand-dot">.</span></a><nav className="main-nav" aria-label="Main navigation"><Button variant="navigation" className="nav-active" onClick={create}><Pencil />Create a story</Button><Button variant="navigation" onClick={() => setGuide('how')}>How it works</Button></nav><div className="header-actions"><Button variant="navigation" className="grownup-link" onClick={() => setGuide('grownups')}>For grown-ups<ArrowUpRight /></Button><Button variant="tool" size="icon" className="theme-button" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme}>{dark ? <Sun /> : <Moon />}</Button></div></header>
    <main><section className="hero" aria-labelledby="hero-title"><div className="hero-copy"><div className="hero-kicker"><span><Sparkles size={13} /></span>BIG IMAGINATIONS START SMALL</div><h1 id="hero-title">Little ideas.<br />Big <em>adventures.</em></h1><p>A doodle. A few words. A world waiting to happen.<br />We’ll help you start a story. <strong>You make it yours.</strong></p><Button variant="story" className="hero-cta" onClick={create}>Let’s make a story<ArrowRight /></Button><div className="hero-footnote"><span className="tiny-stars">{[0,1,2].map(i => <Star key={i} size={11} fill="currentColor" />)}</span>A little spark. A whole lot of you.</div></div><div className="hero-art"><img src={island.url} alt="A curious little fox discovers a storybook castle on a magical floating island." width={600} height={400} fetchPriority="high" /><div className="imagination-note"><Sparkles size={16} />Oh, the places you’ll imagine!</div><span className="hero-doodle" aria-hidden="true">✧</span></div></section>
    <section className="journey" aria-label="Your three-step writing adventure">{[{ icon: Lightbulb, title: 'Plant an idea', copy: 'Draw it or write it.' },{ icon: Feather, title: 'Grow your story', copy: 'A little start. Your own words.' },{ icon: BookOpen, title: 'Watch it come alive', copy: 'Your story, read aloud.' }].map((item, i) => <div key={item.title} className={`journey-step ${step === i + 1 ? 'current' : ''}`} aria-current={step === i + 1 ? 'step' : undefined}><span className="journey-icon"><item.icon size={21} /></span><div><h2><span>0{i + 1}</span>{item.title}</h2><p>{item.copy}</p></div>{i < 2 && <ChevronRight className="journey-arrow" size={18} />}</div>)}</section>
    <StoryWorkspace onStep={setStep} />
    <section className="grownup-banner"><BookOpen /><div><h3>We start the story. They find their voice.</h3><p>Made for little writers with big imaginations. Not for taking over.</p></div><Button variant="navigation" onClick={() => setGuide('grownups')}>The grown-up guide<ArrowRight /></Button></section></main>
    <footer className="site-footer"><span>Made for wonder. Grown with imagination.</span><div className="footer-notes"><span><LockKeyhole />No account needed</span><span><Heart />Kid-friendly by design</span><Button variant="navigation" onClick={() => setGuide('privacy')}><ShieldCheck />Privacy & safety</Button></div><span className="footer-brand"><Sprout size={14} />StorySprout</span></footer>
    <Dialog open={guide !== null} onOpenChange={open => { if (!open) setGuide(null); }}><DialogContent><DialogTitle className="font-display text-2xl">{guide === 'how' ? 'Little steps. Big stories.' : guide === 'grownups' ? 'A little help. Their own voice.' : 'A safe space to imagine.'}</DialogTitle><DialogDescription>{guide === 'how' ? 'Every story begins with a spark.' : guide === 'grownups' ? 'For the grown-ups cheering them on.' : 'Your stories stay with you.'}</DialogDescription><div className="guide-content">{guide === 'how' ? <><h3>01 · Plant an idea</h3><p>Choose a genre, draw a little doodle, or write a few words. Our collection of story starters can offer a spark.</p><h3>02 · Grow your story</h3><p>Take the opening in your own direction. Sprout’s questions help you imagine what comes next.</p><h3>03 · Watch it come alive</h3><p>Finish your adventure, hear it read aloud in supported browsers, and download a copy to keep.</p></> : guide === 'grownups' ? <><h3>The imagination is theirs.</h3><p>StorySprout provides curated, genre-based openings and gentle writing prompts—not a finished story. Children write their own adventures.</p><h3>Celebrate the process.</h3><p>Ask about their characters, listen to their ideas, and encourage them to keep going. Spelling can wait; imagination comes first.</p><h3>No account. No pressure.</h3><p>Story writing stays in this browser session. Download their work before closing the page.</p></> : <><h3>Stories stay in your browser.</h3><p>Story text and drawings are not uploaded to a story service. No account is needed, and closing or refreshing the page clears the story.</p><h3>A small preference, saved.</h3><p>Only your light or dark appearance preference is saved on this device. Download a finished story to keep it.</p><h3>Read-aloud</h3><p>Read-aloud uses your browser’s speech service. Its handling of text depends on your browser and selected voice.</p></>}</div></DialogContent></Dialog>
  </div>;
}
