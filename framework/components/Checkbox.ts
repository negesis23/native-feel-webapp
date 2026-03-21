import { UIComponent, BoxConstraints } from '../core/component';
import { Theme } from '../core/theme';
import { FrameworkEngine } from '../core/engine';

export class Checkbox extends UIComponent {
  checked: boolean = false;
  
  constructor() {
    super();
    this.onPointerDown = (x, y) => {
      this.ripples.push({
        x: x - this.x,
        y: y - this.y,
        radius: 0,
        targetRadius: 48,
        alpha: 0.12,
        state: 'growing'
      });
    };
    this.onPointerUp = () => {
      this.ripples.forEach(r => r.state = 'fading');
    };
  }

  handleClick(x: number, y: number, engine?: FrameworkEngine) {
    this.checked = !this.checked;
    if ((this as any).onChange) (this as any).onChange(this.checked);
    super.handleClick(x, y, engine);
  }

  measure(ctx: CanvasRenderingContext2D, constraints: BoxConstraints) {
    return { width: 48, height: 48 };
  }

  render(ctx: CanvasRenderingContext2D, theme: Theme, dt: number, engine: FrameworkEngine) {
    const cx = this.x + 24;
    const cy = this.y + 24;
    const size = 18;

    // Draw Ripples
    if (this.ripples.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.clip();

      this.ripples.forEach(ripple => {
        if (ripple.state === 'growing') {
          ripple.radius += (ripple.targetRadius - ripple.radius) * 10 * dt + 50 * dt;
          if (ripple.radius > ripple.targetRadius) ripple.radius = ripple.targetRadius;
        } else {
          ripple.radius += (ripple.targetRadius - ripple.radius) * 15 * dt + 200 * dt;
          ripple.alpha -= 0.5 * dt;
        }
        
        ctx.fillStyle = theme.onSurfaceVariant;
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

    if (this.checked) {
      ctx.fillStyle = theme.primary;
      ctx.beginPath();
      ctx.roundRect(cx - size/2, cy - size/2, size, size, 2);
      ctx.fill();
      
      ctx.strokeStyle = theme.onPrimary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy);
      ctx.lineTo(cx - 1, cy + 4);
      ctx.lineTo(cx + 5, cy - 4);
      ctx.stroke();
    } else {
      ctx.strokeStyle = theme.onSurfaceVariant;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx - size/2, cy - size/2, size, size, 2);
      ctx.stroke();
    }
  }
}
