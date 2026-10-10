import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Settings2, Square, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STYLES = [
  { id: 'gentle', emoji: '🌸', name: 'Gentle Voice', note: 'Calm, warm storytelling', rate: 0.85, pitch: 1.05, hint: /female|samantha|zira|aria|jenny|libby|sonia/i },
  { id: 'friendly', emoji: '🧒', name: 'Friendly Voice', note: 'Cheerful and conversational', rate: 1, pitch: 1.25, hint: /guy|daniel|alex|google us/i },
  { id: 'magical', emoji: '🧙', name: 'Magical Storyteller', note: 'Expressive and imaginative', rate: 0.9, pitch: 0.9, hint: /uk|gb|british|ryan|arthur/i },
  { id: 'dramatic', emoji: '🎭', name: 'Dramatic Narrator', note: 'Animated storytelling', rate: 1.05, pitch: 0.75, hint: /male|david|fred|george/i },
  { id: 'bedtime', emoji: '🌙', name: 'Calm Bedtime Voice', note: 'Soft, relaxing narration', rate: 0.72, pitch: 0.95, hint: /female|karen|moira|serena|natasha/i },
] as const;
const SAMPLE = 'Welcome to StorySprout, where every story becomes an adventure!';
const KEY = 'storysprout-voice';

export function StoryNarrator({ text }: { text: string }) {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [styleId, setStyleId] = useState<string>('gentle');
  const [voiceURI, setVoiceURI] = useState('');
  const [state, setState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const token = useRef(0);
  const style = STYLES.find(s => s.id === styleId) ?? STYLES[0];

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    setSupported(true);
    try { const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as { style?: string; voice?: string }; if (saved.style) setStyleId(saved.style); if (saved.voice) setVoiceURI(saved.voice); } catch { /* optional */ }
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load(); window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => { window.speechSynthesis.removeEventListener('voiceschanged', load); window.speechSynthesis.cancel(); };
  }, []);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify({ style: styleId, voice: voiceURI })); } catch { /* optional */ } }, [styleId, voiceURI]);

  const lang = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en';
  const local = voices.filter(v => v.lang.toLowerCase().startsWith(lang)).length ? voices.filter(v => v.lang.toLowerCase().startsWith(lang)) : voices;
  function pickVoice(s = style) {
    return voices.find(v => v.voiceURI === voiceURI) ?? local.find(v => s.hint.test(v.name)) ?? local.find(v => v.default) ?? local[0];
  }

  function speak(content: string, s = style) {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const id = ++token.current;
    const u = new SpeechSynthesisUtterance(content);
    const v = pickVoice(s); if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = s.rate; u.pitch = s.pitch;
    u.onend = () => { if (token.current === id) setState('idle'); };
    u.onerror = e => { if (token.current === id) { setState('idle'); if (e.error !== 'canceled' && e.error !== 'interrupted') setError('This voice couldn’t play on your device. Try another voice, or keep reading on your own!'); } };
    setError(''); setState('playing'); window.speechSynthesis.speak(u);
  }
  function stop() { token.current++; window.speechSynthesis.cancel(); setState('idle'); }
  function pause() { window.speechSynthesis.pause(); setState('paused'); }
  function resume() { window.speechSynthesis.resume(); setState('playing'); }

  if (!supported) return <p className="nudge">Read-aloud isn’t available in this browser, but your story is ready to read right here.</p>;
  return <div className="narrator">
    <div className="narrator-controls">
      {state === 'idle' && <Button variant="story" onClick={() => speak(text)}><Volume2 />Listen to My Story</Button>}
      {state === 'playing' && <Button variant="story" onClick={pause}><Pause />Pause</Button>}
      {state === 'paused' && <Button variant="story" onClick={resume}><Play />Resume</Button>}
      {state !== 'idle' && <Button variant="outline" onClick={stop}><Square />Stop</Button>}
      <Button variant="outline" onClick={() => speak(text)} aria-label="Replay from the start"><RotateCcw />Replay</Button>
      <Button variant="navigation" aria-expanded={open} onClick={() => setOpen(!open)}><Settings2 />Choose a Voice</Button>
      {state === 'playing' && <span className="narrating" aria-live="polite"><span /><span /><span />Reading with {style.name}</span>}
    </div>
    {open && <div className="voice-panel" role="group" aria-label="Choose a reading voice">
      <div className="voice-styles">{STYLES.map(s => <Button key={s.id} variant="genre" aria-pressed={s.id === styleId} onClick={() => { stop(); setStyleId(s.id); }}><span aria-hidden="true">{s.emoji}</span><span className="voice-name"><strong>{s.name}</strong><small>{s.note}</small></span></Button>)}</div>
      <label htmlFor="voice-select">Voice on this device</label>
      <select id="voice-select" value={voiceURI} onChange={e => { stop(); setVoiceURI(e.target.value); }}>
        <option value="">Best match for {style.name}{pickVoice() && voiceURI === '' ? ` (${pickVoice()?.name})` : ''}</option>
        {voices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>)}
      </select>
      <div className="editor-footer"><small>Voices depend on your device and browser. Each style changes the speed and tone.</small><Button variant="outline" onClick={() => speak(SAMPLE)}><Volume2 />Preview Voice</Button></div>
    </div>}
    {error && <p className="nudge" role="alert">{error}</p>}
  </div>;
}
