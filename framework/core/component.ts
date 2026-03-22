import { Theme } from './theme';
import { FrameworkEngine } from './engine';

export interface BoxConstraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
}

export interface Padding {
  top: number; right: number; bottom: number; left: number;
}

export interface Ripple {
  x: number;
  y: number;
  radius: number;
  targetRadius: number;
  alpha: number;
  state: 'growing' | 'fading';
}

export abstract class UIComponent {
  id?: string;
  x: number = 0;
  y: number = 0;
  width: number = 0;
  height: number = 0;
  parent?: UIComponent;
  children: UIComponent[] = [];
  
  flex?: number;
  padding: Padding = { top: 0, right: 0, bottom: 0, left: 0 };
  
  isHovered: boolean = false;
  isFocused: boolean = false;
  isPressed: boolean = false;
  needsScrollIntoView: boolean = false;
  
  ripples: Ripple[] = [];

  onClick?: (x: number, y: number, engine?: FrameworkEngine) => void;
  onPointerDown?: (x: number, y: number, engine?: FrameworkEngine) => void;
  onPointerUp?: (x: number, y: number, engine?: FrameworkEngine) => void;
  onPointerMove?: (x: number, y: number, engine?: FrameworkEngine) => void;
  onKeyDown?: (e: KeyboardEvent) => void;

  handleClick(x: number, y: number, engine?: FrameworkEngine) {
    if (this.onClick) this.onClick(x, y, engine);
  }

  addChild(child: UIComponent) {
    child.parent = this;
    this.children.push(child);
  }

  abstract measure(ctx: CanvasRenderingContext2D, constraints: BoxConstraints): { width: number, height: number };
  
  layout(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  abstract render(ctx: CanvasRenderingContext2D, theme: Theme, dt: number, engine: FrameworkEngine): void;

  hitTest(x: number, y: number): UIComponent | null {
    if (x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height) {
      for (let i = this.children.length - 1; i >= 0; i--) {
        const hit = this.children[i].hitTest(x, y);
        if (hit) return hit;
      }
      return this;
    }
    return null;
  }

  findById(id: string): UIComponent | null {
    if (this.id === id) return this;
    for (const child of this.children) {
      const found = child.findById(id);
      if (found) return found;
    }
    return null;
  }
}
