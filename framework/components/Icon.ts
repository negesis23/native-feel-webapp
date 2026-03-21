import { UIComponent, BoxConstraints } from '../core/component';
import { Theme } from '../core/theme';
import { FrameworkEngine } from '../core/engine';

export class Icon extends UIComponent {
  icon: string = '';
  color?: string;

  measure(ctx: CanvasRenderingContext2D, constraints: BoxConstraints) {
    return { width: 24, height: 24 };
  }

  render(ctx: CanvasRenderingContext2D, theme: Theme, dt: number, engine: FrameworkEngine) {
    ctx.font = '24px "Material Symbols Outlined"';
    ctx.fillStyle = this.color || theme.onSurface;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(this.icon, this.x + 12, this.y + 12);
    ctx.textAlign = 'left';
  }
}
