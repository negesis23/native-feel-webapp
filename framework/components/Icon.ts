import { UIComponent, BoxConstraints } from '../core/component';
import { Theme } from './theme';
import { FrameworkEngine } from './engine';

export class Icon extends UIComponent {
  icon: string = '';
  color?: string;

  measure(ctx: CanvasRenderingContext2D, constraints: BoxConstraints) {
    return { width: 24, height: 24 };
  }

  render(ctx: CanvasRenderingContext2D, theme: Theme, dt: number, engine: FrameworkEngine) {
    ctx.font = '24px "Material Symbols Outlined"';
    ctx.fillStyle = this.color || theme.onSurface;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const metrics = ctx.measureText(this.icon);
    const yOffset = (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
    ctx.fillText(this.icon, this.x + 12, this.y + 12 + yOffset);
    ctx.textAlign = 'left';
  }
}
