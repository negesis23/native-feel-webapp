import { UIComponent, BoxConstraints } from '../core/component';
import { Theme } from '../core/theme';
import { FrameworkEngine } from '../core/engine';

export class Column extends UIComponent {
  gap: number = 0;
  bg?: string;
  radius: number = 0;
  scrollable: boolean = false;
  justifyContent: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly' = 'start';
  alignItems: 'start' | 'center' | 'end' | 'stretch' = 'stretch';

  // Physics state
  scrollY: number = 0;
  velocityY: number = 0;
  stretchAmount: number = 0;
  
  private contentHeight: number = 0;
  private isDragging: boolean = false;
  private lastY: number = 0;
  private lastTime: number = 0;
  private lastDeltaY: number = 0;

  constructor() {
    super();
    this.onPointerDown = (x, y, engine) => {
      if (!this.scrollable || this.contentHeight <= this.height) return;
      this.isDragging = true;
      this.lastY = y;
      this.lastTime = performance.now();
      this.velocityY = 0;
      if (engine) engine.requestRender();
    };

    this.onPointerMove = (x, y, engine) => {
      if (!this.scrollable || !this.isDragging || this.contentHeight <= this.height) return;
      
      const now = performance.now();
      const dt = (now - this.lastTime) / 1000;
      const dy = y - this.lastY;
      
      if (dt > 0) {
        // Smooth out velocity to prevent erratic spikes
        const currentVelocity = dy / dt;
        this.velocityY = this.velocityY * 0.4 + currentVelocity * 0.6;
      }
      
      this.lastY = y;
      this.lastTime = now;
      this.lastDeltaY = dy;

      const minScroll = Math.min(0, this.height - this.contentHeight);
      
      // 1. If currently stretched, absorb dy into stretch first
      if (this.stretchAmount > 0) { // Stretched at top
        const resistance = Math.max(0.05, 0.15 * (1 - this.stretchAmount / 150));
        this.stretchAmount += dy * resistance;
        if (this.stretchAmount < 0) {
          this.scrollY += this.stretchAmount / resistance;
          this.stretchAmount = 0;
        }
      } else if (this.stretchAmount < 0) { // Stretched at bottom
        const resistance = Math.max(0.05, 0.35 * (1 - Math.abs(this.stretchAmount) / 150));
        this.stretchAmount += dy * resistance;
        if (this.stretchAmount > 0) {
          this.scrollY += this.stretchAmount / resistance;
          this.stretchAmount = 0;
        }
      } else {
        // 2. Apply remaining dy to scroll
        if (dy !== 0) {
          this.scrollY += dy;
          // 3. If scroll hits bounds, convert overflow to stretch
          if (this.scrollY > 0) {
            this.stretchAmount += this.scrollY * 0.35;
            if (this.stretchAmount > 100) this.stretchAmount = 100 + (this.stretchAmount - 100) * 0.1;
            this.scrollY = 0;
          } else if (this.scrollY < minScroll) {
            this.stretchAmount += (this.scrollY - minScroll) * 0.35;
            if (this.stretchAmount < -100) this.stretchAmount = -100 + (this.stretchAmount + 100) * 0.1;
            this.scrollY = minScroll;
          }
        }
      }
      
      if (engine) engine.requestRender();
    };

    this.onPointerUp = (x, y, engine) => {
      if (!this.scrollable || !this.isDragging || this.contentHeight <= this.height) return;
      this.isDragging = false;
      if (engine) engine.requestRender();
    };
  }

  measure(ctx: CanvasRenderingContext2D, constraints: BoxConstraints) {
    let totalHeight = this.padding.top + this.padding.bottom;
    let maxWidth = 0;
    let flexTotal = 0;
    for (const child of this.children) {
      if (child.flex) flexTotal += child.flex;
      else {
        const size = child.measure(ctx, { minWidth: 0, maxWidth: constraints.maxWidth - this.padding.left - this.padding.right, minHeight: 0, maxHeight: Infinity });
        child.width = size.width;
        child.height = size.height;
        totalHeight += size.height;
        maxWidth = Math.max(maxWidth, size.width);
      }
    }
    totalHeight += Math.max(0, this.children.length - 1) * this.gap;
    if (flexTotal > 0 && constraints.maxHeight !== Infinity) {
      const remaining = Math.max(0, constraints.maxHeight - totalHeight);
      for (const child of this.children) {
        if (child.flex) {
          const h = (child.flex / flexTotal) * remaining;
          const size = child.measure(ctx, { minWidth: 0, maxWidth: constraints.maxWidth - this.padding.left - this.padding.right, minHeight: h, maxHeight: h });
          child.width = size.width;
          child.height = size.height;
          maxWidth = Math.max(maxWidth, size.width);
          totalHeight += h;
        }
      }
    }
    this.width = Math.min(constraints.maxWidth, Math.max(constraints.minWidth, maxWidth + this.padding.left + this.padding.right));
    this.height = Math.min(constraints.maxHeight, Math.max(constraints.minHeight, totalHeight));
    return { width: this.width, height: this.height };
  }
  layout(x: number, y: number, width: number, height: number) {
    super.layout(x, y, width, height);
    let cy = y + this.padding.top + (this.scrollable ? this.scrollY : 0);
    const cw = width - this.padding.left - this.padding.right;
    
    let totalContentHeight = 0;
    for (const child of this.children) totalContentHeight += child.height;
    
    let currentGap = this.gap;
    if (!this.scrollable && this.children.length > 0) {
      if (this.justifyContent === 'start' || this.justifyContent === 'center' || this.justifyContent === 'end') {
        const availableSpace = height - this.padding.top - this.padding.bottom - totalContentHeight - this.gap * Math.max(0, this.children.length - 1);
        if (this.justifyContent === 'center') {
          cy += availableSpace / 2;
        } else if (this.justifyContent === 'end') {
          cy += availableSpace;
        }
      } else {
        const availableSpace = height - this.padding.top - this.padding.bottom - totalContentHeight;
        if (this.justifyContent === 'space-between') {
          if (this.children.length > 1) currentGap = availableSpace / (this.children.length - 1);
          else currentGap = 0;
        } else if (this.justifyContent === 'space-around') {
          currentGap = availableSpace / this.children.length;
          cy += currentGap / 2;
        } else if (this.justifyContent === 'space-evenly') {
          currentGap = availableSpace / (this.children.length + 1);
          cy += currentGap;
        }
      }
    }

    for (const child of this.children) {
      let cx = x + this.padding.left;
      let childWidth = cw;
      if (this.alignItems === 'center') {
        cx += (cw - child.width) / 2;
        childWidth = child.width;
      } else if (this.alignItems === 'end') {
        cx += cw - child.width;
        childWidth = child.width;
      } else if (this.alignItems === 'start') {
        childWidth = child.width;
      }
      
      child.layout(cx, cy, childWidth, child.height);
      cy += child.height + currentGap;
    }
  }
  
  render(ctx: CanvasRenderingContext2D, theme: Theme, dt: number, engine: FrameworkEngine) {
    if (this.scrollable) {
      this.contentHeight = this.children.reduce((acc, child) => acc + child.height + this.gap, 0) - this.gap + this.padding.top + this.padding.bottom;
      
      if (this.contentHeight <= this.height) {
        this.scrollY = 0;
        this.stretchAmount = 0;
        this.velocityY = 0;
        this.isDragging = false;
      } else {
        const minScroll = Math.min(0, this.height - this.contentHeight);
        
        if (!this.isDragging) {
          if (this.stretchAmount !== 0) {
            this.stretchAmount += (0 - this.stretchAmount) * (1 - Math.exp(-25 * dt));
            if (Math.abs(this.stretchAmount) < 0.5) this.stretchAmount = 0;
            engine.requestRender();
          }
          
          if (Math.abs(this.velocityY) > 0.1) {
            this.scrollY += this.velocityY * dt;
            // Increase friction from -2.5 to -5.0 to make it stop faster
            this.velocityY *= Math.exp(-5.0 * dt);
            
            if (this.scrollY > 0) {
              this.stretchAmount += this.scrollY * 0.5; // Dampen the impact
              if (this.stretchAmount > 100) this.stretchAmount = 100 + (this.stretchAmount - 100) * 0.1; // Soft clamp
              this.scrollY = 0;
              this.velocityY = 0; // Kill velocity to prevent further extreme stretch
            } else if (this.scrollY < minScroll) {
              this.stretchAmount += (this.scrollY - minScroll) * 0.5; // Dampen the impact
              if (this.stretchAmount < -100) this.stretchAmount = -100 + (this.stretchAmount + 100) * 0.1; // Soft clamp
              this.scrollY = minScroll;
              this.velocityY = 0; // Kill velocity to prevent further extreme stretch
            }
            engine.requestRender();
          } else {
            this.velocityY = 0;
          }
        }
      }
      
      // Update layout based on scrollY
      let cy = this.y + this.padding.top + this.scrollY;
      const cw = this.width - this.padding.left - this.padding.right;
      for (const child of this.children) {
        let cx = this.x + this.padding.left;
        let childWidth = cw;
        if (this.alignItems === 'center') {
          cx += (cw - child.width) / 2;
          childWidth = child.width;
        } else if (this.alignItems === 'end') {
          cx += cw - child.width;
          childWidth = child.width;
        } else if (this.alignItems === 'start') {
          childWidth = child.width;
        }
        child.layout(cx, cy, childWidth, child.height);
        cy += child.height + this.gap; 
      }
    }

    if (this.bg) {
      ctx.fillStyle = this.bg === 'surfaceVariant' ? theme.surfaceVariant : (this.bg === 'surface' ? theme.surface : this.bg);
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, this.width, this.height, this.radius);
      ctx.fill();
    }
    
    if (this.scrollable) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(this.x, this.y, this.width, this.height);
      ctx.clip();
      
      let stretchY = 1;
      let originY = this.y;

      if (this.stretchAmount > 0) {
        stretchY = 1 + (this.stretchAmount / this.height) * 0.15;
        originY = this.y;
      } else if (this.stretchAmount < 0) {
        stretchY = 1 + (Math.abs(this.stretchAmount) / this.height) * 0.15;
        originY = this.y + this.height;
      }

      if (stretchY !== 1) {
        ctx.translate(0, originY);
        ctx.scale(1, stretchY);
        ctx.translate(0, -originY);
      }
    }
    
    for (const child of this.children) {
      if (this.scrollable) {
        if (child.y + child.height < this.y - 200 || child.y > this.y + this.height + 200) continue;
      }
      child.render(ctx, theme, dt, engine);
    }
    
    if (this.scrollable) {
      ctx.restore();
    }
  }
}

export class Row extends UIComponent {
  gap: number = 0;
  bg?: string;
  radius: number = 0;
  justifyContent: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly' = 'start';
  alignItems: 'start' | 'center' | 'end' | 'stretch' = 'center';

  measure(ctx: CanvasRenderingContext2D, constraints: BoxConstraints) {
    let totalWidth = this.padding.left + this.padding.right;
    let maxHeight = 0;
    let flexTotal = 0;
    for (const child of this.children) {
      if (child.flex) flexTotal += child.flex;
      else {
        const size = child.measure(ctx, { minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: constraints.maxHeight - this.padding.top - this.padding.bottom });
        child.width = size.width;
        child.height = size.height;
        totalWidth += size.width;
        maxHeight = Math.max(maxHeight, size.height);
      }
    }
    totalWidth += Math.max(0, this.children.length - 1) * this.gap;
    if (flexTotal > 0 && constraints.maxWidth !== Infinity) {
      const remaining = Math.max(0, constraints.maxWidth - totalWidth);
      for (const child of this.children) {
        if (child.flex) {
          const w = (child.flex / flexTotal) * remaining;
          const size = child.measure(ctx, { minWidth: w, maxWidth: w, minHeight: 0, maxHeight: constraints.maxHeight - this.padding.top - this.padding.bottom });
          child.width = size.width;
          child.height = size.height;
          maxHeight = Math.max(maxHeight, size.height);
          totalWidth += w;
        }
      }
    }
    this.width = Math.min(constraints.maxWidth, Math.max(constraints.minWidth, totalWidth));
    this.height = Math.min(constraints.maxHeight, Math.max(constraints.minHeight, maxHeight + this.padding.top + this.padding.bottom));
    return { width: this.width, height: this.height };
  }
  layout(x: number, y: number, width: number, height: number) {
    super.layout(x, y, width, height);
    let cx = x + this.padding.left;
    const ch = height - this.padding.top - this.padding.bottom;
    
    let totalContentWidth = 0;
    for (const child of this.children) totalContentWidth += child.width;
    
    let currentGap = this.gap;
    if (this.children.length > 0) {
      if (this.justifyContent === 'start' || this.justifyContent === 'center' || this.justifyContent === 'end') {
        const availableSpace = width - this.padding.left - this.padding.right - totalContentWidth - this.gap * Math.max(0, this.children.length - 1);
        if (this.justifyContent === 'center') {
          cx += availableSpace / 2;
        } else if (this.justifyContent === 'end') {
          cx += availableSpace;
        }
      } else {
        const availableSpace = width - this.padding.left - this.padding.right - totalContentWidth;
        if (this.justifyContent === 'space-between') {
          if (this.children.length > 1) currentGap = availableSpace / (this.children.length - 1);
          else currentGap = 0;
        } else if (this.justifyContent === 'space-around') {
          currentGap = availableSpace / this.children.length;
          cx += currentGap / 2;
        } else if (this.justifyContent === 'space-evenly') {
          currentGap = availableSpace / (this.children.length + 1);
          cx += currentGap;
        }
      }
    }

    for (const child of this.children) {
      let cy = y + this.padding.top;
      let childHeight = ch;
      if (this.alignItems === 'center') {
        cy += (ch - child.height) / 2;
        childHeight = child.height;
      } else if (this.alignItems === 'end') {
        cy += ch - child.height;
        childHeight = child.height;
      } else if (this.alignItems === 'start') {
        childHeight = child.height;
      }
      
      child.layout(cx, cy, child.width, childHeight);
      cx += child.width + currentGap;
    }
  }
  render(ctx: CanvasRenderingContext2D, theme: Theme, dt: number, engine: FrameworkEngine) {
    if (this.bg) {
      ctx.fillStyle = this.bg === 'surfaceVariant' ? theme.surfaceVariant : (this.bg === 'surface' ? theme.surface : this.bg);
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, this.width, this.height, this.radius);
      ctx.fill();
    }
    for (const child of this.children) child.render(ctx, theme, dt, engine);
  }
}
