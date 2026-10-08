import { useRef, useState, type PointerEvent } from 'react';
import { Eraser, Undo2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StoryCanvas() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const history = useRef<ImageData[]>([]);
  const [color, setColor] = useState('green');
  const [width, setWidth] = useState(4);
  const [error, setError] = useState('');
  function snapshot() {
    const ctx = canvas.current?.getContext('2d');
    if (ctx) history.current.push(ctx.getImageData(0, 0, 900, 350));
  }
  function point(event: PointerEvent<HTMLCanvasElement>): [number, number] {
    const rect = event.currentTarget.getBoundingClientRect();
    return [(event.clientX - rect.left) * 900 / rect.width, (event.clientY - rect.top) * 350 / rect.height];
  }
  function start(event: PointerEvent<HTMLCanvasElement>) {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    snapshot(); drawing.current = true; event.currentTarget.setPointerCapture(event.pointerId);
    const [x, y] = point(event);
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.strokeStyle = getComputedStyle(event.currentTarget).getPropertyValue('--draw-' + color).trim();
    ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineTo(x + 0.1, y + 0.1); ctx.stroke();
  }
  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvas.current?.getContext('2d');
    if (ctx) { const [x, y] = point(event); ctx.lineTo(x, y); ctx.stroke(); }
  }
  return <div className="drawing-area">
    <div className="drawing-toolbar">
      <div className="swatches" aria-label="Drawing colors">{['green', 'gold', 'rose', 'blue', 'ink'].map(c => <Button key={c} variant="tool" size="icon" aria-label={`${c} pencil`} aria-pressed={color === c} onClick={() => setColor(c)} className={`swatch swatch-${c}`} />)}</div>
      <input aria-label="Pencil thickness" type="range" min="2" max="12" value={width} onChange={e => setWidth(Number(e.target.value))} />
      <div className="toolbar-actions">
        <Button variant="tool" size="icon" title="Undo last stroke" aria-label="Undo last stroke" onClick={() => { const image = history.current.pop(); if (image) canvas.current?.getContext('2d')?.putImageData(image, 0, 0); }}><Undo2 /></Button>
        <Button variant="tool" size="icon" title="Clear drawing" aria-label="Clear drawing" onClick={() => { snapshot(); canvas.current?.getContext('2d')?.clearRect(0, 0, 900, 350); }}><Eraser /></Button>
        <Button variant="tool" size="icon" title="Upload a drawing" aria-label="Upload a drawing" onClick={() => input.current?.click()}><Upload /></Button>
      </div>
    </div>
    <canvas ref={canvas} width={900} height={350} className="story-canvas" aria-label="Draw your story idea" onPointerDown={start} onPointerMove={move} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} />
    <input ref={input} type="file" accept="image/*" hidden onChange={e => {
      const file = e.target.files?.[0]; if (!file) return;
      if (file.size > 10 * 1024 * 1024) { setError('Choose an image smaller than 10 MB.'); return; }
      const url = URL.createObjectURL(file); const image = new Image();
      image.onload = () => { snapshot(); const scale = Math.min(900 / image.width, 350 / image.height); canvas.current?.getContext('2d')?.drawImage(image, (900-image.width*scale)/2, (350-image.height*scale)/2, image.width*scale, image.height*scale); URL.revokeObjectURL(url); setError(''); };
      image.onerror = () => { URL.revokeObjectURL(url); setError('That image could not be opened. Try another picture.'); }; image.src = url;
    }} />
    {error && <p role="alert">{error}</p>}
  </div>;
}