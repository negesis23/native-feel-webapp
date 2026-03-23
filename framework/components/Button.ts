import { UIComponent, BoxConstraints } from '../core/component';
import { Theme } from './theme';
import { FrameworkEngine } from './engine';

export type ButtonVariant = 'filled' | 'outlined' | 'tonal' | 'text';

export class Button extends UIComponent {
  text: string = '';
  variant: ButtonVariant = 'filled';
  icon?: string;
  
  constructor() {
    super();
    this.onPointerDown = (x, y) => {
      this.ripples.push({
        x: x - this.x,
        y: y - this.y,
        radius: 0,
        targetRadius: Math.sqrt(this.width * this.width + this.height * this.height),
        alpha: 0.12,
        state: 'growing'
      });
    };
    this.onPointerUp = () => {
      this.ripples.forEach(r => r.state = 'fading');
    };
  }

  measure(ctx: CanvasRenderingContext2D, constraints: BoxConstraints) {
    ctx.font = '500 14px "Google Sans", sans-serif';
    const metrics = ctx.measureText(this.text);
    const iconWidth = this.icon ? 24 + 8 : 0; // icon size + gap
    return { width: Math.max(64, metrics.width + iconWidth + 48), height: 40 };
  }

  render(ctx: CanvasRenderingContext2D, theme: Theme, dt: number, engine: FrameworkEngine) {
    let bg = 'transparent';
    let fg = theme.primary;
    let border = 'transparent';

    switch (this.variant) {
      case 'filled':
        bg = theme.primary;
        fg = theme.onPrimary;
        break;
      case 'tonal':
        bg = theme.secondaryContainer;
        fg = theme.onSecondaryContainer;
        break;
      case 'outlined':
        border = theme.outline;
        break;
      case 'text':
        // fg is already primary
        break;
    }

    // Draw Background
    if (bg !== 'transparent') {
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, this.width, this.height, 20);
      ctx.fill();
    }

    // Draw Border
    if (border !== 'transparent') {
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1, 20);
      ctx.stroke();
    }

    // Draw Ripples
    if (this.ripples.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, this.width, this.height, 20);
      ctx.clip();

      this.ripples.forEach(ripple => {
        if (ripple.state === 'growing') {
          ripple.radius += (ripple.targetRadius - ripple.radius) * 10 * dt + 50 * dt;
          if (ripple.radius > ripple.targetRadius) ripple.radius = ripple.targetRadius;
        } else {
          ripple.radius += (ripple.targetRadius - ripple.radius) * 15 * dt + 200 * dt;
          ripple.alpha -= 0.5 * dt;
        }
        
        ctx.fillStyle = fg;
        ctx.globalAlpha = Math.max(0, ripple.alpha);
        ctx.beginPath();
        ctx.arc(this.x + ripple.x, this.y + ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });
      ctx.restore();

      this.ripples = this.ripples.filter(r => r.alpha > 0);
      if (this.ripples.length > 0) engine.requestRender();
    }

    // Draw Content
    ctx.fillStyle = fg;
    ctx.textBaseline = 'alphabetic';
    
    let startX = this.x + this.width / 2;
    if (this.icon) {
      ctx.font = '500 14px "Google Sans", sans-serif';
      const textWidth = ctx.measureText(this.text).width;
      const totalWidth = 18 + 8 + textWidth;
      startX = this.x + (this.width - totalWidth) / 2;
      
      ctx.font = '18px "Material Symbols Outlined"';
      ctx.textAlign = 'left';
      const iconMetrics = ctx.measureText(this.icon);
      const iconYOffset = (iconMetrics.actualBoundingBoxAscent - iconMetrics.actualBoundingBoxDescent) / 2;
      ctx.fillText(this.icon, startX, this.y + this.height / 2 + iconYOffset);
      startX += 18 + 8;
    }

    ctx.font = '500 14px "Google Sans", sans-serif';
    ctx.textAlign = this.icon ? 'left' : 'center';
    const textMetrics = ctx.measureText(this.text);
    const textYOffset = (textMetrics.actualBoundingBoxAscent - textMetrics.actualBoundingBoxDescent) / 2;
    ctx.fillText(this.text, startX, this.y + this.height / 2 + textYOffset);
    ctx.textAlign = 'left';
  }
}
