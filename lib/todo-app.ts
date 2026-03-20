import { CanvasEngine } from './canvas-engine';

interface Todo {
  id: number;
  text: string;
  done: boolean;
  ripple?: Ripple;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  active: boolean;
}

export function startApp(canvas: HTMLCanvasElement) {
  const engine = new CanvasEngine(canvas);

  // State
  let todos: Todo[] = [
    { id: 1, text: 'Learn WebAssembly', done: true },
    { id: 2, text: 'Build Custom UI Engine', done: true },
    { id: 3, text: 'Bypass HTML/CSS/DOM', done: true },
    { id: 4, text: 'Implement Material Design 3', done: false },
    { id: 5, text: 'Add Momentum Scrolling', done: false },
    { id: 6, text: 'Feel Native like Flutter', done: false },
  ];

  let scrollY = 0;
  let velocityY = 0;
  const friction = 0.95;

  // Material 3 Dark Theme Colors
  const colors = {
    background: '#141218',
    surface: '#141218',
    surfaceContainer: '#211F26',
    primary: '#D0BCFF',
    onPrimary: '#381E72',
    primaryContainer: '#4F378B',
    onPrimaryContainer: '#EADDFF',
    outline: '#938F99',
    onSurface: '#E6E0E9',
    onSurfaceVariant: '#CAC4D0',
    ripple: 'rgba(208, 188, 255, 0.12)',
  };

  // Layout
  const appBarHeight = 64;
  const itemHeight = 72;
  const fabSize = 56;
  const fabMargin = 16;
  const maxContentWidth = 600;

  // Helpers
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawShadow(ctx: CanvasRenderingContext2D, blur: number, offsetY: number, alpha: number) {
    ctx.shadowColor = `rgba(0, 0, 0, ${alpha})`;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = offsetY;
  }

  function clearShadow(ctx: CanvasRenderingContext2D) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  engine.onClick = (x, y) => {
    const contentX = Math.max(0, (engine.width - maxContentWidth) / 2);
    const contentW = Math.min(engine.width, maxContentWidth);

    // Check FAB click
    const fabX = engine.width - fabSize - fabMargin;
    const fabY = engine.height - fabSize - fabMargin;
    if (x >= fabX && x <= fabX + fabSize && y >= fabY && y <= fabY + fabSize) {
      // Simulate native dialog without HTML
      const text = window.prompt('New Todo:');
      if (text && text.trim()) {
        todos.unshift({ id: Date.now(), text: text.trim(), done: false });
      }
      return;
    }

    // Check Todo item click
    if (y > appBarHeight) {
      const listY = y - appBarHeight - scrollY;
      const index = Math.floor(listY / itemHeight);
      if (index >= 0 && index < todos.length) {
        const todo = todos[index];
        todo.done = !todo.done;
        
        // Add ripple
        todo.ripple = {
          x: x - contentX,
          y: listY - (index * itemHeight),
          radius: 0,
          alpha: 1,
          active: true,
        };
      }
    }
  };

  engine.onDraw = (ctx, width, height, dt) => {
    // Physics
    if (engine.isPointerDown && engine.isDragging) {
      scrollY += engine.pointerDeltaY;
      velocityY = engine.pointerDeltaY / dt;
    } else {
      scrollY += velocityY * dt;
      velocityY *= friction;
      if (Math.abs(velocityY) < 10) velocityY = 0;
    }

    // Bounds
    const maxScroll = 0;
    const minScroll = Math.min(0, height - appBarHeight - (todos.length * itemHeight) - fabSize - fabMargin * 2);
    if (scrollY > maxScroll) {
      scrollY += (maxScroll - scrollY) * 10 * dt; // Spring back
    } else if (scrollY < minScroll) {
      scrollY += (minScroll - scrollY) * 10 * dt; // Spring back
    }

    // Background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    const contentX = Math.max(0, (width - maxContentWidth) / 2);
    const contentW = Math.min(width, maxContentWidth);

    // Draw List
    ctx.save();
    ctx.beginPath();
    ctx.rect(contentX, appBarHeight, contentW, height - appBarHeight);
    ctx.clip();

    todos.forEach((todo, i) => {
      const itemY = appBarHeight + scrollY + (i * itemHeight);
      
      // Culling
      if (itemY + itemHeight < appBarHeight || itemY > height) return;

      // Ripple animation
      if (todo.ripple && todo.ripple.active) {
        todo.ripple.radius += 800 * dt;
        todo.ripple.alpha -= 2 * dt;
        if (todo.ripple.alpha <= 0) {
          todo.ripple.active = false;
        } else {
          ctx.save();
          ctx.beginPath();
          ctx.rect(contentX, itemY, contentW, itemHeight);
          ctx.clip();
          ctx.fillStyle = `rgba(208, 188, 255, ${todo.ripple.alpha * 0.12})`;
          ctx.beginPath();
          ctx.arc(contentX + todo.ripple.x, itemY + todo.ripple.y, todo.ripple.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Checkbox
      const cbSize = 20;
      const cbX = contentX + 16;
      const cbY = itemY + (itemHeight - cbSize) / 2;
      
      if (todo.done) {
        ctx.fillStyle = colors.primary;
        roundRect(ctx, cbX, cbY, cbSize, cbSize, 2);
        ctx.fill();
        
        // Checkmark
        ctx.strokeStyle = colors.onPrimary;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cbX + 5, cbY + 10);
        ctx.lineTo(cbX + 9, cbY + 14);
        ctx.lineTo(cbX + 15, cbY + 6);
        ctx.stroke();
      } else {
        ctx.strokeStyle = colors.outline;
        ctx.lineWidth = 2;
        roundRect(ctx, cbX, cbY, cbSize, cbSize, 2);
        ctx.stroke();
      }

      // Text
      ctx.font = '16px system-ui, -apple-system, sans-serif';
      ctx.textBaseline = 'middle';
      if (todo.done) {
        ctx.fillStyle = colors.onSurfaceVariant;
        ctx.fillText(todo.text, cbX + cbSize + 16, itemY + itemHeight / 2);
        // Strikethrough
        const textWidth = ctx.measureText(todo.text).width;
        ctx.strokeStyle = colors.onSurfaceVariant;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cbX + cbSize + 16, itemY + itemHeight / 2);
        ctx.lineTo(cbX + cbSize + 16 + textWidth, itemY + itemHeight / 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = colors.onSurface;
        ctx.fillText(todo.text, cbX + cbSize + 16, itemY + itemHeight / 2);
      }

      // Divider
      if (i < todos.length - 1) {
        ctx.fillStyle = colors.surfaceContainer;
        ctx.fillRect(contentX + 16, itemY + itemHeight - 1, contentW - 32, 1);
      }
    });
    ctx.restore();

    // Draw App Bar
    ctx.fillStyle = colors.surface;
    ctx.fillRect(0, 0, width, appBarHeight);
    if (scrollY < 0) {
      drawShadow(ctx, 4, 2, 0.2);
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, width, appBarHeight);
      clearShadow(ctx);
    }
    
    ctx.fillStyle = colors.onSurface;
    ctx.font = '500 22px system-ui, -apple-system, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('Native Canvas Todo', contentX + 16, appBarHeight / 2);

    // Draw FAB
    const fabX = width - fabSize - fabMargin;
    const fabY = height - fabSize - fabMargin;
    
    drawShadow(ctx, 8, 4, 0.3);
    ctx.fillStyle = colors.primaryContainer;
    roundRect(ctx, fabX, fabY, fabSize, fabSize, 16);
    ctx.fill();
    clearShadow(ctx);

    // FAB Icon (+)
    ctx.strokeStyle = colors.onPrimaryContainer;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fabX + fabSize / 2, fabY + 16);
    ctx.lineTo(fabX + fabSize / 2, fabY + fabSize - 16);
    ctx.moveTo(fabX + 16, fabY + fabSize / 2);
    ctx.lineTo(fabX + fabSize - 16, fabY + fabSize / 2);
    ctx.stroke();
  };

  engine.start();

  return () => {
    engine.stop();
  };
}
