import { UIComponent, BoxConstraints } from '../core/component';
import { Theme } from './theme';
import { FrameworkEngine } from './engine';

export class Text extends UIComponent {
  text: string = '';
  variant: 'display' | 'headline' | 'title' | 'body' | 'label' = 'body';
  color?: string;
  
  private lines: string[] = [];
  private lineHeight: number = 0;

  private getFont() {
    switch (this.variant) {
      case 'display': return '400 36px "Google Sans", sans-serif';
      case 'headline': return '400 24px "Google Sans", sans-serif';
      case 'title': return '500 16px "Google Sans", sans-serif';
      case 'label': return '500 14px "Google Sans", sans-serif';
      case 'body': default: return '400 14px "Google Sans", sans-serif';
    }
  }

  measure(ctx: CanvasRenderingContext2D, constraints: BoxConstraints) {
    ctx.font = this.getFont();
    const words = this.text.split(' ');
    this.lines = [];
    let currentLine = '';
    let maxWidth = 0;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > constraints.maxWidth && i > 0) {
        this.lines.push(currentLine.trim());
        currentLine = words[i] + ' ';
      } else {
        currentLine = testLine;
        maxWidth = Math.max(maxWidth, metrics.width);
      }
    }
    this.lines.push(currentLine.trim());
    
    const fontSize = parseInt(this.getFont().match(/\d+px/)?.[0] || '14');
    this.lineHeight = fontSize * 1.2;
    
    return {
      width: Math.max(constraints.minWidth || 0, Math.min(constraints.maxWidth, maxWidth)),
      height: Math.max(constraints.minHeight || 0, this.lines.length * this.lineHeight)
    };
  }

  render(ctx: CanvasRenderingContext2D, theme: Theme, dt: number, engine: FrameworkEngine) {
    ctx.font = this.getFont();
    ctx.fillStyle = this.color || theme.onSurface;
    ctx.textBaseline = 'top';
    
    for (let i = 0; i < this.lines.length; i++) {
      ctx.fillText(this.lines[i], this.x, this.y + (i * this.lineHeight));
    }
  }
}
