import { CanvasEngine } from './canvas-engine';

interface Ripple {
  id: number;
  x: number;
  y: number;
  radius: number;
  targetRadius: number;
  alpha: number;
  state: 'growing' | 'fading';
}

interface Todo {
  id: number;
  text: string;
  done: boolean;
  ripples: Ripple[];
}

export function startApp(canvas: HTMLCanvasElement) {
  const engine = new CanvasEngine(canvas);

  let todos: Todo[] = [
    { id: 1, text: 'Learn WebAssembly', done: true, ripples: [] },
    { id: 2, text: 'Build Custom UI Engine', done: true, ripples: [] },
    { id: 3, text: 'Bypass HTML/CSS/DOM', done: true, ripples: [] },
    { id: 4, text: 'Implement Material Design 3', done: true, ripples: [] },
    { id: 5, text: 'Add Momentum Scrolling', done: true, ripples: [] },
    { id: 6, text: 'Feel Native like Flutter', done: true, ripples: [] },
    { id: 7, text: 'Rubber Band Overscroll', done: true, ripples: [] },
    { id: 8, text: 'Native Press Ripples', done: true, ripples: [] },
    { id: 9, text: 'PWA Installable', done: true, ripples: [] },
    { id: 10, text: '60fps Smoothness', done: false, ripples: [] },
    { id: 11, text: 'Squash & Stretch Animation', done: false, ripples: [] },
    { id: 12, text: 'Perfect Scroll Physics', done: false, ripples: [] },
  ];

  let scrollY = 0;
  let velocityY = 0;
  let stretchAmount = 0; // Separate visual stretch from physical scroll

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
  };

  const appBarHeight = 64;
  const itemHeight = 72;
  const fabSize = 56;
  const fabMargin = 16;
  const maxContentWidth = 600;

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

  let activeRippleItem: Todo | null = null;

  engine.onPointerDownCb = (x, y) => {
    const contentX = Math.max(0, (engine.width - maxContentWidth) / 2);
    const contentW = Math.min(engine.width, maxContentWidth);
    
    if (y > appBarHeight) {
      const minScroll = Math.min(0, engine.height - appBarHeight - (todos.length * itemHeight) - fabSize - fabMargin * 2);
      const clampedScrollY = Math.max(minScroll, Math.min(0, scrollY));
      const listY = y - appBarHeight - clampedScrollY;
      const index = Math.floor(listY / itemHeight);
      
      if (index >= 0 && index < todos.length && x >= contentX && x <= contentX + contentW) {
        const todo = todos[index];
        activeRippleItem = todo;
        const maxR = Math.sqrt(contentW * contentW + itemHeight * itemHeight);
        todo.ripples.push({
          id: Date.now(),
          x: x - contentX,
          y: listY - (index * itemHeight),
          radius: 0,
          targetRadius: maxR,
          alpha: 0,
          state: 'growing'
        });
      }
    }
  };

  engine.onPointerUpCb = (x, y) => {
    if (activeRippleItem) {
      activeRippleItem.ripples.forEach(r => {
        if (r.state === 'growing') r.state = 'fading';
      });
      activeRippleItem = null;
    }
    
    // Transfer fling velocity on release
    if (engine.isDragging) {
      velocityY = engine.getFlingVelocityY();
    }
  };

  engine.onClick = (x, y) => {
    const fabX = engine.width - fabSize - fabMargin;
    const fabY = engine.height - fabSize - fabMargin;
    if (x >= fabX && x <= fabX + fabSize && y >= fabY && y <= fabY + fabSize) {
      const text = window.prompt('New Todo:');
      if (text && text.trim()) {
        todos.unshift({ id: Date.now(), text: text.trim(), done: false, ripples: [] });
      }
      return;
    }

    if (y > appBarHeight) {
      const minScroll = Math.min(0, engine.height - appBarHeight - (todos.length * itemHeight) - fabSize - fabMargin * 2);
      const clampedScrollY = Math.max(minScroll, Math.min(0, scrollY));
      const listY = y - appBarHeight - clampedScrollY;
      const index = Math.floor(listY / itemHeight);
      if (index >= 0 && index < todos.length) {
        todos[index].done = !todos[index].done;
      }
    }
  };

  engine.onDraw = (ctx, width, height, dt) => {
    const minScroll = Math.min(0, height - appBarHeight - (todos.length * itemHeight) - fabSize - fabMargin * 2);
    
    // ROCK-SOLID FLUTTER/ANDROID 12 PHYSICS
    if (engine.isPointerDown) {
      if (engine.isDragging) {
        let dy = engine.pointerDeltaY;
        
        // 1. If currently stretched, absorb dy into stretch first
        if (stretchAmount > 0) { // Stretched at top
          const resistance = Math.max(0.05, 0.35 * (1 - stretchAmount / 300)); // Hard rubber resistance
          stretchAmount += dy * resistance;
          if (stretchAmount < 0) { // Crossed back to normal
            dy = stretchAmount / resistance;
            stretchAmount = 0;
          } else {
            dy = 0;
          }
        } else if (stretchAmount < 0) { // Stretched at bottom
          const resistance = Math.max(0.05, 0.35 * (1 - Math.abs(stretchAmount) / 300)); // Hard rubber resistance
          stretchAmount += dy * resistance;
          if (stretchAmount > 0) { // Crossed back to normal
            dy = stretchAmount / resistance;
            stretchAmount = 0;
          } else {
            dy = 0;
          }
        }

        // 2. Apply remaining dy to scroll
        if (dy !== 0) {
          scrollY += dy;
          // 3. If scroll hits bounds, convert overflow to stretch
          if (scrollY > 0) {
            stretchAmount += scrollY * 0.35; // Hard rubber scaling
            scrollY = 0;
          } else if (scrollY < minScroll) {
            stretchAmount += (scrollY - minScroll) * 0.35; // Hard rubber scaling
            scrollY = minScroll;
          }
        }
        
        // Cancel ripple if dragging starts
        if (activeRippleItem) {
          activeRippleItem.ripples.forEach(r => r.state = 'fading');
          activeRippleItem = null;
        }
      }
    } else {
      // RELEASED STATE

      // 1. Snapback stretch smoothly (Stable Exponential Decay, NO oscillating spring)
      if (stretchAmount !== 0) {
        stretchAmount += (0 - stretchAmount) * (1 - Math.exp(-16 * dt)); // Snaps back faster (hard rubber)
        if (Math.abs(stretchAmount) < 0.5) stretchAmount = 0;
      }

      // 2. Momentum scroll
      if (Math.abs(velocityY) > 0.1) {
        scrollY += velocityY * dt;
        velocityY *= Math.exp(-2.5 * dt); // Less friction (tidak peret, lebih meluncur)
        
        // If momentum hits the boundary, convert to stretch and STOP velocity
        if (scrollY > 0) {
          stretchAmount += scrollY * 0.06; // Flinging into top boundary (hard rubber absorbs less)
          scrollY = 0;
          velocityY = 0;
        } else if (scrollY < minScroll) {
          stretchAmount += (scrollY - minScroll) * 0.06; // Flinging into bottom boundary
          scrollY = minScroll;
          velocityY = 0;
        }
      } else {
        velocityY = 0;
      }
    }

    const contentX = Math.max(0, (width - maxContentWidth) / 2);
    const contentW = Math.min(width, maxContentWidth);

    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    // Stretch Overscroll Effect (Purely Visual)
    let stretchY = 1;
    let originY = appBarHeight;

    if (stretchAmount > 0) {
      stretchY = 1 + (stretchAmount / height) * 0.15; // Reduced visual stretch (karet keras)
      originY = appBarHeight;
    } else if (stretchAmount < 0) {
      stretchY = 1 + (Math.abs(stretchAmount) / height) * 0.15; // Reduced visual stretch (karet keras)
      originY = height;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(contentX, appBarHeight, contentW, height - appBarHeight);
    ctx.clip();

    if (stretchY !== 1) {
      ctx.translate(0, originY);
      ctx.scale(1, stretchY);
      ctx.translate(0, -originY);
    }

    todos.forEach((todo, i) => {
      const itemY = appBarHeight + scrollY + (i * itemHeight);
      
      if (itemY + itemHeight < appBarHeight - 200 || itemY > height + 200) return;

      // Update & Draw Ripples
      todo.ripples.forEach(ripple => {
        if (ripple.state === 'growing') {
          // Slow but continuous growth to 100% while held down
          ripple.radius += (ripple.targetRadius - ripple.radius) * 2 * dt + 100 * dt;
          if (ripple.radius > ripple.targetRadius) ripple.radius = ripple.targetRadius;
          ripple.alpha += (0.12 - ripple.alpha) * 15 * dt;
        } else {
          // Fast expansion to corners when released
          ripple.radius += (ripple.targetRadius - ripple.radius) * 15 * dt + 800 * dt;
          ripple.alpha -= 0.5 * dt;
        }
      });
      todo.ripples = todo.ripples.filter(r => r.alpha > 0);

      if (todo.ripples.length > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(contentX, itemY, contentW, itemHeight);
        ctx.clip();
        todo.ripples.forEach(ripple => {
          ctx.fillStyle = `rgba(208, 188, 255, ${Math.max(0, ripple.alpha)})`;
          ctx.beginPath();
          ctx.arc(contentX + ripple.x, itemY + ripple.y, ripple.radius, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      const cbSize = 20;
      const cbX = contentX + 16;
      const cbY = itemY + (itemHeight - cbSize) / 2;
      
      if (todo.done) {
        ctx.fillStyle = colors.primary;
        roundRect(ctx, cbX, cbY, cbSize, cbSize, 2);
        ctx.fill();
        
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

      ctx.font = '16px system-ui, -apple-system, sans-serif';
      ctx.textBaseline = 'middle';
      if (todo.done) {
        ctx.fillStyle = colors.onSurfaceVariant;
        ctx.fillText(todo.text, cbX + cbSize + 16, itemY + itemHeight / 2);
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

      if (i < todos.length - 1) {
        ctx.fillStyle = colors.surfaceContainer;
        ctx.fillRect(contentX + 16, itemY + itemHeight - 1, contentW - 32, 1);
      }
    });
    ctx.restore();

    // Draw App Bar
    ctx.fillStyle = colors.surface;
    ctx.fillRect(0, 0, width, appBarHeight);
    if (scrollY < 0 || stretchAmount > 0) {
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
