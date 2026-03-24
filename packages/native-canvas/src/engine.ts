export class FrameworkEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  root: any; // Widget
  
  public lastError: Error | null = null;
  
  private pointerDownX: number = 0;
  private pointerDownY: number = 0;
  private hasDragged: boolean = false;
  private pressedComponent: any = null;
  private hoveredComponent: any = null;
  private longPressTimeout: any = null;
  private isDirty: boolean = true;

  constructor(canvas: HTMLCanvasElement, root: any) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.root = root;

    window.addEventListener('resize', function() { this.handleResize(); }.bind(this));
    this.handleResize();

    this.setupEvents();
    this.loop();
  }

  updateRoot(newRoot: any) {
    if (this.root && this.root.destroy) {
      this.root.destroy();
    }
    this.root = newRoot;
    this.handleResize();
    this.requestRender();
  }

  handleResize() {
    var dpr = window.devicePixelRatio || 1;
    var rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : this.canvas.getBoundingClientRect();
    
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';

    var width = rect.width;
    var height = rect.height;
    
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    this.requestRender();
  }

  requestRender() {
    this.isDirty = true;
  }

  private setupEvents() {
    var self = this;
    var getPointerCoords = function(e: MouseEvent | PointerEvent) {
      var rect = self.canvas.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      var scaleX = self.canvas.width / rect.width / dpr;
      var scaleY = self.canvas.height / rect.height / dpr;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    this.canvas.addEventListener('pointerdown', function(e: any) {
      var coords = getPointerCoords(e);
      var x = coords.x;
      var y = coords.y;
      
      self.pointerDownX = x;
      self.pointerDownY = y;
      self.hasDragged = false;
      if (self.longPressTimeout) clearTimeout(self.longPressTimeout);

      var hit = self.root.hitTest(x, y);
      
      if (hit) {
        hit._isPressed = true;
        self.pressedComponent = hit;
        
        var node = hit;
        while (node) {
          if (node.addRipple) node.addRipple(x, y);
          if (node._events.onPointerDown) node._events.onPointerDown(x, y, self);
          if (node._events.onPressIn) node._events.onPressIn(x, y, self);
          
          if (node._events.whilePressed) {
             var wp = node._events.whilePressed;
             wp.fn(x, y, self); // fire immediately once
             node._wpTimer = setInterval(function(n, fx, fy) {
                 return function() {
                     if (n._events.whilePressed) n._events.whilePressed.fn(fx, fy, self);
                     self.requestRender();
                 };
             }(node, x, y), wp.interval || 100);
          }
          
          node = node._parent;
        }

        self.longPressTimeout = setTimeout(function() {
          if (!self.hasDragged && self.pressedComponent) {
            var lpNode = self.pressedComponent;
            var handled = false;
            while (lpNode) {
              if (lpNode._events.onLongPress) {
                lpNode._events.onLongPress(x, y, self);
                handled = true;
              }
              lpNode = lpNode._parent;
            }
            if (handled) {
              self.hasDragged = true; // Prevent click from firing if long pressed
              self.requestRender();
            }
          }
        }, 500);
      }
      self.requestRender();
    });

    this.canvas.addEventListener('pointerup', function(e: any) {
      if (self.longPressTimeout) clearTimeout(self.longPressTimeout);
      
      var coords = getPointerCoords(e);
      var x = coords.x;
      var y = coords.y;
      
      if (self.pressedComponent) {
        self.pressedComponent._isPressed = false;
        
        var node = self.pressedComponent;
        while (node) {
          if (node._wpTimer) {
              clearInterval(node._wpTimer);
              node._wpTimer = null;
          }
          if (node.fadeRipples) node.fadeRipples();
          if (node._events.onPointerUp) node._events.onPointerUp(x, y, self);
          if (node._events.onPressOut) node._events.onPressOut(x, y, self);
          node = node._parent;
        }
        
        var s = self.pressedComponent._style;
        var isInside = x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h;
                         
        if (isInside && !self.hasDragged) {
           var clkNode = self.pressedComponent;
           while(clkNode) {
               if (clkNode._events.onClick) {
                   clkNode._events.onClick(x, y, self);
                   break;
               }
               clkNode = clkNode._parent;
           }
        }
        self.pressedComponent = null;
      }
      self.requestRender();
    });

    this.canvas.addEventListener('pointermove', function(e: any) {
      var coords = getPointerCoords(e);
      var x = coords.x;
      var y = coords.y;
      
      if (self.pressedComponent) {
        if (Math.abs(x - self.pointerDownX) > 10 || Math.abs(y - self.pointerDownY) > 10) {
          self.hasDragged = true;
          if (self.longPressTimeout) clearTimeout(self.longPressTimeout);
          
          if (self.pressedComponent._isPressed) {
             self.pressedComponent._isPressed = false; 
             var fNode = self.pressedComponent;
             while (fNode) {
               if (fNode._wpTimer) {
                   clearInterval(fNode._wpTimer);
                   fNode._wpTimer = null;
               }
               if (fNode.fadeRipples) fNode.fadeRipples();
               if (fNode._events.onPressOut) fNode._events.onPressOut(x, y, self);
               fNode = fNode._parent;
             }
          }
        }
        
        var node = self.pressedComponent;
        while (node) {
          if (node._events.onPointerMove) node._events.onPointerMove(x, y, self);
          node = node._parent;
        }
      }

      // Hover logic
      var hit = self.root.hitTest(x, y);
      if (hit !== self.hoveredComponent) {
        if (self.hoveredComponent) {
          var lNode = self.hoveredComponent;
          while (lNode) {
            if (lNode._events.onPointerLeave) lNode._events.onPointerLeave(x, y, self);
            lNode = lNode._parent;
          }
        }
        self.hoveredComponent = hit;
        if (hit) {
          var eNode = hit;
          while (eNode) {
            if (eNode._events.onPointerEnter) eNode._events.onPointerEnter(x, y, self);
            eNode = eNode._parent;
          }
        }
        self.requestRender();
      }
    });
  }

  private renderError(err: Error) {
    var ctx = this.ctx;
    var canvas = this.canvas;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    ctx.fillStyle = '#1A1C1E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFB4AB';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Framework Exception', 20, 40);
    
    ctx.font = 'bold 14px monospace';
    var message = "Error: " + err.message;
    var currentY = 75;
    var maxWidth = canvas.width - 40;
    var lineHeight = 18;

    var wrapAndDraw = function(text: string, isStack: boolean) {
      var currentLine = '';
      for (var i=0; i<text.length; i++) {
        var char = text[i];
        var testLine = currentLine + char;
        if (ctx.measureText(testLine).width > maxWidth) {
          ctx.fillText(currentLine, 20, currentY);
          currentY += lineHeight;
          currentLine = char;
        } else {
          currentLine = testLine;
        }
        if (currentY > canvas.height - 20) break;
      }
      ctx.fillText(currentLine, 20, currentY);
      currentY += lineHeight;
    };

    wrapAndDraw(message, false);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#E2E2E6';
    currentY += 10;

    if (err.stack) {
      var stackLines = err.stack.split('\n');
      var startIdx = stackLines[0].indexOf(err.message) !== -1 ? 1 : 0;
      for (var i = startIdx; i < stackLines.length; i++) {
        wrapAndDraw(stackLines[i].replace(/\t/g, '  '), true);
        if (currentY > canvas.height - 20) break;
      }
    }
  }

  private lastTime: number = performance.now();

  private loop() {
    var self = this;
    function frame() {
        var now = performance.now();
        var dt = (now - self.lastTime) / 1000;
        self.lastTime = now;
        
        try {
          if (self.lastError) {
            self.renderError(self.lastError);
          } else if (self.isDirty) {
            self.isDirty = false;
            
            // Clear screen
            var rect = self.canvas.parentElement ? self.canvas.parentElement.getBoundingClientRect() : self.canvas.getBoundingClientRect();
            self.ctx.clearRect(0, 0, rect.width, rect.height);
            
            // Layout Pass
            self.root.measure(self.ctx, rect.width, rect.height);
            self.root.layout(0, 0, rect.width, rect.height);
            
            // Render Pass
            self.root.render(self.ctx, dt, self);
          }
        } catch (e) {
          self.lastError = e as Error;
          console.error("Framework Render Error:", e);
        }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
}
