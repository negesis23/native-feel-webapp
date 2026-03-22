import { UIComponent, BoxConstraints } from '../core/component';
import { Theme } from '../core/theme';
import { FrameworkEngine } from '../core/engine';

export type IconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined';

export class IconButton extends UIComponent {
  icon: string = '';
  variant: IconButtonVariant = 'standard';
  
  constructor() {
    super();
    this.onPointerDown = (x, y) => {
      this.ripples.push({
        x: x - this.x,
        y: y - this.y,
        radius: 0,
        targetRadius: 40,
        alpha: 0.12,
        state: 'growing'
      });
    };
    this.onPointerUp = () => {
      this.ripples.forEach(r => r.state = 'fading');
    };
  }

  measure(ctx: CanvasRenderingContext2D, constraints: BoxConstraints) {
    return { width: 40, height: 40 };
  }

  render(ctx: CanvasRenderingContext2D, theme: Theme, dt: number, engine: FrameworkEngine) {
    let bg = 'transparent';
    let fg = theme.onSurfaceVariant;
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
      case 'standard':
        // fg is already onSurfaceVariant
        break;
    }

    // Draw Background
    if (bg !== 'transparent') {
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, Math.min(this.width, this.height) / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Border
    if (border !== 'transparent') {
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, Math.min(this.width, this.height) / 2 - 0.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw Ripples
    if (this.ripples.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, Math.min(this.width, this.height) / 2, 0, Math.PI * 2);
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

    // Draw Icon
    ctx.fillStyle = fg;
    ctx.font = '24px "Material Symbols Outlined"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const metrics = ctx.measureText(this.icon);
    const yOffset = (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
    ctx.fillText(this.icon, this.x + this.width / 2, this.y + this.height / 2 + yOffset);
    ctx.textAlign = 'left';
  }
}
