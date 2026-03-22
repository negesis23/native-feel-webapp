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
  private singleLineInput: HTMLInputElement;
  private multiLineInput: HTMLTextAreaElement;
  public get textInput(): HTMLInputElement | HTMLTextAreaElement {
    if (this.focusedComponent && (this.focusedComponent as any).multiline) {
      return this.multiLineInput;
    }
    return this.singleLineInput;
  }

  private isDestroyed = false;
  
  private pointerDownX: number = 0;
  private pointerDownY: number = 0;
  private hasDragged: boolean = false;

  constructor(canvas: HTMLCanvasElement, root: UIComponent, seedColor: string = '#6750A4', isDark: boolean = true) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.root = root;
    this.theme = generateTheme(seedColor, isDark);
    
    const setupInput = (input: HTMLElement) => {
      input.style.position = 'fixed';
      input.style.opacity = '0';
      input.style.pointerEvents = 'none';
      input.style.top = '0px';
      input.style.left = '0px';
      input.style.width = '1px';
      input.style.height = '1px';
      input.style.padding = '0';
      input.style.margin = '0';
      input.style.display = 'none';
      input.style.zIndex = '-1';
      document.body.appendChild(input);
    };

    this.singleLineInput = document.createElement('input');
    this.singleLineInput.type = 'text';
    this.singleLineInput.enterKeyHint = 'go';
    setupInput(this.singleLineInput);

    this.multiLineInput = document.createElement('textarea');
    setupInput(this.multiLineInput);
    
    const setupListeners = (input: HTMLInputElement | HTMLTextAreaElement) => {
      input.addEventListener('keydown', (e) => {
        const evt = e as KeyboardEvent;
        if (this.focusedComponent && (this.focusedComponent as any).isTextInput) {
          const tf = this.focusedComponent as any;
          if (evt.key === 'Enter' && !tf.multiline) {
            evt.preventDefault();
            if (tf.onSubmit) tf.onSubmit(tf.value);
            input.blur();
          }
        }
      });

      input.addEventListener('input', (e) => {
        if (this.focusedComponent && (this.focusedComponent as any).isTextInput) {
          const tf = this.focusedComponent as any;
          tf.value = input.value;
          tf.reportedValues.add(input.value);
          tf.cursorIndex = input.selectionStart ?? tf.value.length;
          tf.needsScrollIntoView = true;
          if (tf.onChange) {
            tf.onChange(tf.value);
          }
          this.requestRender();
        }
      });

      input.addEventListener('blur', () => {
        if (this.focusedComponent && (this.focusedComponent as any).isTextInput) {
          this.focusedComponent.isFocused = false;
          this.focusedComponent = null;
          input.style.display = 'none';
          this.requestRender();
        }
      });
    };

    setupListeners(this.singleLineInput);
    setupListeners(this.multiLineInput);

    document.addEventListener('selectionchange', () => {
      if ((document.activeElement === this.singleLineInput || document.activeElement === this.multiLineInput) && this.focusedComponent && (this.focusedComponent as any).isTextInput) {
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

        if ((node as any).isTextInput && (oldNode as any).isTextInput) {
          (node as any).cursorIndex = (oldNode as any).cursorIndex;
          (node as any).selectionStart = (oldNode as any).selectionStart;
          (node as any).selectionEnd = (oldNode as any).selectionEnd;
          (node as any).showTooltip = (oldNode as any).showTooltip;
          (node as any).scrollX = (oldNode as any).scrollX;
          (node as any).scrollY = (oldNode as any).scrollY;
          (node as any).reportedValues = (oldNode as any).reportedValues;
          
          if ((node as any).propValue === (oldNode as any).propValue) {
            // Prop didn't change programmatically, preserve user's typed value
            (node as any).value = (oldNode as any).value;
          } else if ((node as any).reportedValues.has((node as any).propValue)) {
            // Prop changed, but it's a stale echo of a value we recently reported!
            // Ignore it and preserve user's typed value
            (node as any).value = (oldNode as any).value;
            // We can optionally remove older values from the set to prevent memory leaks
            // but it's probably fine for short sessions.
          } else {
            // Prop changed programmatically to a NEW value!
            // Update hidden input if focused
            (node as any).reportedValues.clear();
            if (this.focusedComponent === oldNode || this.focusedComponent === node) {
              this.textInput.value = (node as any).value;
              this.textInput.setSelectionRange((node as any).cursorIndex, (node as any).cursorIndex);
            }
          }
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
    this.canvas.addEventListener('touchend', (e) => {
      if (this.focusedComponent && (this.focusedComponent as any).isTextInput) {
        e.preventDefault();
        this.textInput.focus();
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (this.focusedComponent && (this.focusedComponent as any).isTextInput) {
        e.preventDefault();
        this.textInput.focus();
      }
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.pointerDownX = x;
      this.pointerDownY = y;
      this.hasDragged = false;

      const hit = this.root.hitTest(x, y);
      
      if (this.focusedComponent && this.focusedComponent !== hit) {
        this.focusedComponent.isFocused = false;
        this.focusedComponent = null;
        this.singleLineInput.style.display = 'none';
        this.multiLineInput.style.display = 'none';
        this.singleLineInput.blur();
        this.multiLineInput.blur();
      }
      
      if (hit) {
        hit.isPressed = true;
        this.pressedComponent = hit;
        
        // Focus text input immediately on touch start for reliable mobile keyboard
        if ((hit as any).isTextInput) {
          e.preventDefault();
          this.focusedComponent = hit;
          hit.isFocused = true;
          hit.needsScrollIntoView = true;
          this.textInput.style.display = 'block';
          if (this.textInput.value !== (hit as any).value) {
            this.textInput.value = (hit as any).value || '';
          }
          this.textInput.focus();
        }
        
        let node: UIComponent | undefined = hit;
        while (node) {
          if (node.onPointerDown) node.onPointerDown(x, y, this);
          node = node.parent;
        }
      } else {
        this.focusedComponent = null;
        this.singleLineInput.style.display = 'none';
        this.multiLineInput.style.display = 'none';
        this.singleLineInput.blur();
        this.multiLineInput.blur();
      }
      this.requestRender();
    });

    this.canvas.addEventListener('pointerup', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const hit = this.root.hitTest(x, y);
      
      if (this.pressedComponent) {
        this.pressedComponent.isPressed = false;
        
        let node: UIComponent | undefined = this.pressedComponent;
        while (node) {
          if (node.onPointerUp) node.onPointerUp(x, y, this);
          node = node.parent;
        }
        
        // Only trigger click if released inside the pressed component and no drag occurred
        const isInside = x >= this.pressedComponent.x && x <= this.pressedComponent.x + this.pressedComponent.width &&
                         y >= this.pressedComponent.y && y <= this.pressedComponent.y + this.pressedComponent.height;
                         
        if (isInside && !this.hasDragged) {
          this.focusedComponent = this.pressedComponent;
          this.pressedComponent.isFocused = true;
          
          this.pressedComponent.handleClick(x, y, this);
        }
        this.pressedComponent = null;
      }
      this.requestRender();
    });

    this.canvas.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (this.pressedComponent) {
        if (Math.abs(x - this.pointerDownX) > 25 || Math.abs(y - this.pointerDownY) > 25) {
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

  private ensureVisible(component: UIComponent): boolean {
    let adjusted = false;
    let node: UIComponent | undefined = component;
    
    // Find scrollable parent
    while (node && node.parent) {
      const parentNode: UIComponent = node.parent;
      if ((parentNode as any).scrollable) {
        const col = parentNode as any;
        // Check if component is out of view
        const topOverflow = parentNode.y - component.y;
        const bottomOverflow = (component.y + component.height) - (parentNode.y + parentNode.height);
        
        const oldScrollY = col.scrollY;
        
        if (bottomOverflow > 0) {
          col.scrollY -= bottomOverflow + 20;
        } else if (topOverflow > 0) {
          col.scrollY += topOverflow + 20;
        }
        
        const minScroll = Math.min(0, col.height - col.contentHeight);
        if (col.scrollY < minScroll) col.scrollY = minScroll;
        if (col.scrollY > 0) col.scrollY = 0;
        
        if (col.scrollY !== oldScrollY) {
          adjusted = true;
        }
        
        break; // Only adjust the immediate scrollable parent
      }
      node = parentNode;
    }
    return adjusted;
  }

  private render(dt: number) {
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;
    
    this.ctx.fillStyle = this.theme.background;
    this.ctx.fillRect(0, 0, width, height);

    this.root.measure(this.ctx, { minWidth: width, maxWidth: width, minHeight: height, maxHeight: height });
    this.root.layout(0, 0, width, height);

    if (this.focusedComponent && this.focusedComponent.needsScrollIntoView) {
      if (this.ensureVisible(this.focusedComponent)) {
        this.root.layout(0, 0, width, height);
      }
      this.focusedComponent.needsScrollIntoView = false;
    }

    this.ctx.save();
    // Pass engine reference so components can request render during animations
    this.root.render(this.ctx, this.theme, dt, this);
    this.ctx.restore();
  }

  destroy() {
    this.isDestroyed = true;
    if (this.singleLineInput && this.singleLineInput.parentNode) {
      this.singleLineInput.parentNode.removeChild(this.singleLineInput);
    }
    if (this.multiLineInput && this.multiLineInput.parentNode) {
      this.multiLineInput.parentNode.removeChild(this.multiLineInput);
    }
  }
}
