import { UIComponent } from './component';
import { Theme, generateTheme } from './theme';

export class FrameworkEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  root: UIComponent;
  theme: Theme;
  focusedComponent: UIComponent | null = null;
  pressedComponent: UIComponent | null = null;
  
  private isDirty = true;
  private lastTime = performance.now();
  private textInput: HTMLInputElement;

  private isDestroyed = false;
  scrollYOffset: number = 0;
  
  private pointerDownX: number = 0;
  private pointerDownY: number = 0;
  private hasDragged: boolean = false;

  constructor(canvas: HTMLCanvasElement, root: UIComponent, seedColor: string = '#6750A4', isDark: boolean = true) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.root = root;
    this.theme = generateTheme(seedColor, isDark);
    
    this.textInput = document.createElement('input');
    this.textInput.type = 'text';
    this.textInput.style.position = 'fixed';
    this.textInput.style.opacity = '0';
    this.textInput.style.pointerEvents = 'none';
    this.textInput.style.top = '0px';
    this.textInput.style.left = '0px';
    this.textInput.style.width = '1px';
    this.textInput.style.height = '1px';
    this.textInput.style.padding = '0';
    this.textInput.style.margin = '0';
    this.textInput.style.display = 'none';
    this.textInput.style.zIndex = '-1';
    
    // We need to append it to the body
    document.body.appendChild(this.textInput);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        if (this.focusedComponent && (this.focusedComponent as any).isTextInput) {
          const vpHeight = window.visualViewport!.height;
          const compBottom = this.focusedComponent.y + this.focusedComponent.height + this.scrollYOffset;
          if (compBottom > vpHeight) {
            this.scrollYOffset = vpHeight - (this.focusedComponent.y + this.focusedComponent.height + 20);
          } else if (window.visualViewport!.height === window.innerHeight) {
            this.scrollYOffset = 0;
          }
          this.requestRender();
        } else {
          this.scrollYOffset = 0;
          this.requestRender();
        }
      });
    }

    this.textInput.addEventListener('input', (e) => {
      if (this.focusedComponent && (this.focusedComponent as any).isTextInput) {
        const tf = this.focusedComponent as any;
        tf.value = this.textInput.value;
        tf.cursorIndex = this.textInput.selectionStart ?? tf.value.length;
        if (tf.onChange) {
          tf.onChange(tf.value);
        }
        this.requestRender();
      }
    });

    this.textInput.addEventListener('blur', () => {
      if (this.focusedComponent && (this.focusedComponent as any).isTextInput) {
        this.focusedComponent.isFocused = false;
        this.focusedComponent = null;
        this.textInput.style.display = 'none';
        this.requestRender();
      }
    });

    document.addEventListener('selectionchange', () => {
      if (document.activeElement === this.textInput && this.focusedComponent && (this.focusedComponent as any).isTextInput) {
        const tf = this.focusedComponent as any;
        tf.cursorIndex = this.textInput.selectionStart ?? 0;
        this.requestRender();
      }
    });

    this.setupEvents();
    this.loop();
  }

  updateRoot(newRoot: UIComponent) {
    // Preserve state for components with IDs
    const preserveState = (oldNode: UIComponent, newNode: UIComponent) => {
      if (oldNode.id && newNode.id === oldNode.id) {
        newNode.isFocused = oldNode.isFocused;
        newNode.isPressed = oldNode.isPressed;
        newNode.isHovered = oldNode.isHovered;
        newNode.ripples = oldNode.ripples;
        
        if (newNode.isFocused) this.focusedComponent = newNode;
        if (newNode.isPressed) this.pressedComponent = newNode;
      }
      
      // We don't have a full diffing algorithm, so we just match by ID globally
      // It's better to just find all nodes with IDs in the old tree and apply them to the new tree
    };

    const oldNodesWithIds = new Map<string, UIComponent>();
    const collectIds = (node: UIComponent) => {
      if (node.id) oldNodesWithIds.set(node.id, node);
      node.children.forEach(collectIds);
    };
    collectIds(this.root);

    this.focusedComponent = null;
    this.pressedComponent = null;

    const applyIds = (node: UIComponent) => {
      if (node.id && oldNodesWithIds.has(node.id)) {
        const oldNode = oldNodesWithIds.get(node.id)!;
        node.isFocused = oldNode.isFocused;
        node.isPressed = oldNode.isPressed;
        node.isHovered = oldNode.isHovered;
        node.ripples = oldNode.ripples;
        
        if ((node as any).scrollable && (oldNode as any).scrollable) {
          (node as any).scrollY = (oldNode as any).scrollY;
          (node as any).velocityY = (oldNode as any).velocityY;
        }
        
        if (node.isFocused) this.focusedComponent = node;
        if (node.isPressed) this.pressedComponent = node;
      }
      node.children.forEach(applyIds);
    };
    applyIds(newRoot);

    this.root = newRoot;
    this.requestRender();
  }

  requestRender() {
    this.isDirty = true;
  }

  private setupEvents() {
    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top - this.scrollYOffset;
      
      this.pointerDownX = x;
      this.pointerDownY = y;
      this.hasDragged = false;

      const hit = this.root.hitTest(x, y);
      
      if (this.focusedComponent && this.focusedComponent !== hit) {
        this.focusedComponent.isFocused = false;
        this.focusedComponent = null;
        this.textInput.style.display = 'none';
        this.textInput.blur();
      }
      
      if (hit) {
        hit.isPressed = true;
        this.pressedComponent = hit;
        
        let node: UIComponent | undefined = hit;
        while (node) {
          if (node.onPointerDown) node.onPointerDown(x, y, this);
          node = node.parent;
        }
      } else {
        this.focusedComponent = null;
        this.textInput.style.display = 'none';
        this.textInput.blur();
      }
      this.requestRender();
    });

    this.canvas.addEventListener('pointerup', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top - this.scrollYOffset;
      
      const hit = this.root.hitTest(x, y);
      
      if (this.pressedComponent) {
        this.pressedComponent.isPressed = false;
        
        let node: UIComponent | undefined = this.pressedComponent;
        while (node) {
          if (node.onPointerUp) node.onPointerUp(x, y, this);
          node = node.parent;
        }
        
        // Only trigger click if released on the same component and no drag occurred
        if (hit === this.pressedComponent && !this.hasDragged) {
          this.focusedComponent = hit;
          hit.isFocused = true;
          
          hit.handleClick(x, y, this);
        }
        this.pressedComponent = null;
      }
      this.requestRender();
    });

    this.canvas.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top - this.scrollYOffset;
      
      if (this.pressedComponent) {
        if (Math.abs(x - this.pointerDownX) > 15 || Math.abs(y - this.pointerDownY) > 15) {
          this.hasDragged = true;
          this.pressedComponent.isPressed = false; // Cancel visual press state
        }
        
        let node: UIComponent | undefined = this.pressedComponent;
        while (node) {
          if (node.onPointerMove) node.onPointerMove(x, y, this);
          node = node.parent;
        }
      }
    });

    window.addEventListener('keydown', (e) => {
      if (this.focusedComponent && this.focusedComponent.onKeyDown) {
        this.focusedComponent.onKeyDown(e);
        this.requestRender();
      }
    });
  }

  private loop = () => {
    if (this.isDestroyed) return;
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Always render if dirty, or if any component requests animation frames
    // For simplicity, we'll pass dt to render. Components can set engine.isDirty = true if they are animating.
    if (this.isDirty) {
      this.isDirty = false; // Components animating will set this back to true during render
      this.render(dt);
    }
    requestAnimationFrame(this.loop);
  }

  private render(dt: number) {
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;
    
    this.ctx.fillStyle = this.theme.background;
    this.ctx.fillRect(0, 0, width, height);

    this.root.measure(this.ctx, { minWidth: width, maxWidth: width, minHeight: height, maxHeight: height });
    this.root.layout(0, 0, width, height);

    this.ctx.save();
    this.ctx.translate(0, this.scrollYOffset);
    // Pass engine reference so components can request render during animations
    this.root.render(this.ctx, this.theme, dt, this);
    this.ctx.restore();
  }

  destroy() {
    this.isDestroyed = true;
    if (this.textInput && this.textInput.parentNode) {
      this.textInput.parentNode.removeChild(this.textInput);
    }
  }
}
