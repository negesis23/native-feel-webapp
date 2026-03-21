import { UIComponent, BoxConstraints } from '../core/component';
import { Theme } from '../core/theme';
import { FrameworkEngine } from '../core/engine';

export class TextField extends UIComponent {
  value: string = '';
  placeholder: string = '';
  onChange?: (val: string) => void;
  isTextInput = true;
  
  cursorTimer: number = 0;
  showCursor: boolean = true;
  cursorIndex: number = 0;
  charPositions: number[] = [];
  
  showTooltip: boolean = false;
  private pressTimer: any;
  private draggingHandle: 'start' | 'end' | null = null;
  
  private scrollX: number = 0;

  constructor() {
    super();
    this.onPointerDown = (x, y, engine) => {
      const textInput = engine ? (engine as any).textInput : null;
      let selectionStart = this.cursorIndex;
      let selectionEnd = this.cursorIndex;
      if (textInput && document.activeElement === textInput) {
        selectionStart = textInput.selectionStart ?? this.cursorIndex;
        selectionEnd = textInput.selectionEnd ?? this.cursorIndex;
      }

      const cursorY = this.y + this.height / 2 - 10;
      const cursorHeight = 20;
      const tipY = cursorY + cursorHeight;
      const handleRadius = 10;

      // Check if clicking on handles
      if (selectionStart !== selectionEnd) {
        const startX = this.charPositions[Math.min(selectionStart, selectionEnd)] - this.scrollX;
        const endX = this.charPositions[Math.max(selectionStart, selectionEnd)] - this.scrollX;
        
        if (Math.hypot(x - startX, y - (tipY + handleRadius)) < handleRadius * 2) {
          this.draggingHandle = 'start';
          return;
        }
        if (Math.hypot(x - endX, y - (tipY + handleRadius)) < handleRadius * 2) {
          this.draggingHandle = 'end';
          return;
        }
      } else if (this.isFocused) {
        const visualCursorX = (this.charPositions[this.cursorIndex] || this.x + 16) - this.scrollX;
        if (Math.hypot(x - visualCursorX, y - (tipY + handleRadius)) < handleRadius * 2) {
          this.draggingHandle = 'end';
          return;
        }
      }

      // Check Tooltip click
      if (this.showTooltip) {
        const visualCursorX = (this.charPositions[this.cursorIndex] || this.x + 16) - this.scrollX;
        const ttX = Math.max(this.x, Math.min(this.x + this.width - 150, visualCursorX - 75));
        const ttY = this.y - 50;
        if (x >= ttX && x <= ttX + 150 && y >= ttY && y <= ttY + 40) {
          const actionX = x - ttX;
          if (actionX < 50) { // Cut
            navigator.clipboard.writeText(this.value);
            this.value = '';
            this.cursorIndex = 0;
          } else if (actionX < 100) { // Copy
            navigator.clipboard.writeText(this.value);
          } else { // Paste
            navigator.clipboard.readText().then(text => {
              this.value = this.value.slice(0, this.cursorIndex) + text + this.value.slice(this.cursorIndex);
              this.cursorIndex += text.length;
              if (this.onChange) this.onChange(this.value);
              if (engine) {
                (engine as any).textInput.value = this.value;
                (engine as any).textInput.setSelectionRange(this.cursorIndex, this.cursorIndex);
                engine.requestRender();
              }
            });
          }
          this.showTooltip = false;
          if (engine) engine.requestRender();
          return;
        }
      }
      
      this.showTooltip = false;

      // Long press for tooltip
      clearTimeout(this.pressTimer);
      this.pressTimer = setTimeout(() => {
        this.showTooltip = true;
        if (engine) engine.requestRender();
      }, 500);
    };

    this.onPointerMove = (x, y, engine) => {
      if (this.draggingHandle && engine) {
        let closestDist = Infinity;
        let closestIdx = 0;
        for(let i=0; i<this.charPositions.length; i++) {
          const dist = Math.abs(x + this.scrollX - this.charPositions[i]);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = i;
          }
        }
        
        const textInput = (engine as any).textInput;
        let newStart = textInput.selectionStart ?? 0;
        let newEnd = textInput.selectionEnd ?? 0;
        
        if (this.draggingHandle === 'start') {
          if (closestIdx > newEnd) {
            this.draggingHandle = 'end';
            newStart = newEnd;
            newEnd = closestIdx;
          } else {
            newStart = closestIdx;
          }
        } else {
          if (closestIdx < newStart) {
            this.draggingHandle = 'start';
            newEnd = newStart;
            newStart = closestIdx;
          } else {
            newEnd = closestIdx;
          }
        }
        
        textInput.setSelectionRange(newStart, newEnd, this.draggingHandle === 'start' ? 'backward' : 'forward');
        this.cursorIndex = closestIdx;
        engine.requestRender();
        return;
      }

      if (engine && (engine as any).hasDragged) {
        clearTimeout(this.pressTimer);
      }
    };

    this.onPointerUp = () => {
      this.draggingHandle = null;
      clearTimeout(this.pressTimer);
    };
    
    this.onClick = (x, y, engine) => {
      this.isFocused = true;
      
      // Find closest character for cursor
      if (this.charPositions.length > 0) {
        let closestDist = Infinity;
        let closestIdx = 0;
        for(let i=0; i<this.charPositions.length; i++) {
          const dist = Math.abs(x + this.scrollX - this.charPositions[i]);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = i;
          }
        }
        this.cursorIndex = closestIdx;
      }

      if (engine) {
        (engine as any).textInput.style.display = 'block';
        (engine as any).textInput.value = this.value || '';
        (engine as any).textInput.focus();
        setTimeout(() => {
          (engine as any).textInput.setSelectionRange(this.cursorIndex, this.cursorIndex);
        }, 10);
        engine.requestRender();
      }
    };
  }

  measure(ctx: CanvasRenderingContext2D, constraints: BoxConstraints) {
    return { width: constraints.maxWidth, height: 56 };
  }

  render(ctx: CanvasRenderingContext2D, theme: Theme, dt: number, engine: FrameworkEngine) {
    ctx.fillStyle = theme.surfaceVariant;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, [4, 4, 0, 0]);
    ctx.fill();

    ctx.fillStyle = this.isFocused ? theme.primary : theme.onSurfaceVariant;
    ctx.fillRect(this.x, this.y + this.height - (this.isFocused ? 2 : 1), this.width, this.isFocused ? 2 : 1);

    ctx.font = '400 16px "Google Sans Flex", sans-serif';
    ctx.textBaseline = 'middle';
    
    this.charPositions = [this.x + 16];
    let currentX = this.x + 16;
    
    // Calculate char positions without rendering yet
    for(let i=0; i<this.value.length; i++) {
      const char = this.value[i];
      currentX += ctx.measureText(char).width;
      this.charPositions.push(currentX);
    }

    // Adjust scrollX to keep cursor visible
    const cursorX = this.charPositions[this.cursorIndex] || this.x + 16;
    const padding = 16;
    if (cursorX - this.scrollX > this.x + this.width - padding) {
      this.scrollX = cursorX - (this.x + this.width - padding);
    } else if (cursorX - this.scrollX < this.x + padding) {
      this.scrollX = Math.max(0, cursorX - (this.x + padding));
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.clip();

    // Draw selection highlight
    let selectionStart = this.cursorIndex;
    let selectionEnd = this.cursorIndex;
    if (engine && (engine as any).textInput && document.activeElement === (engine as any).textInput && this.isFocused) {
      selectionStart = (engine as any).textInput.selectionStart ?? this.cursorIndex;
      selectionEnd = (engine as any).textInput.selectionEnd ?? this.cursorIndex;
    }

    if (selectionStart !== selectionEnd) {
      const startX = this.charPositions[Math.min(selectionStart, selectionEnd)] - this.scrollX;
      const endX = this.charPositions[Math.max(selectionStart, selectionEnd)] - this.scrollX;
      ctx.fillStyle = theme.primaryContainer || 'rgba(103, 80, 164, 0.3)';
      ctx.fillRect(startX, this.y + 8, endX - startX, this.height - 16);
    }

    if (this.value.length === 0) {
      ctx.fillStyle = theme.onSurfaceVariant;
      ctx.fillText(this.placeholder, this.x + 16 - this.scrollX, this.y + this.height / 2);
    } else {
      ctx.fillStyle = theme.onSurface;
      currentX = this.x + 16;
      for(let i=0; i<this.value.length; i++) {
        const char = this.value[i];
        ctx.fillText(char, currentX - this.scrollX, this.y + this.height / 2);
        currentX += ctx.measureText(char).width;
      }
    }

    ctx.restore();

    if (this.isFocused) {
      this.cursorTimer += dt;
      if (this.cursorTimer > 0.5) {
        this.showCursor = !this.showCursor;
        this.cursorTimer = 0;
      }

      const visualCursorX = cursorX - this.scrollX;
      const cursorY = this.y + this.height / 2 - 10;
      const cursorHeight = 20;
      
      if (visualCursorX >= this.x && visualCursorX <= this.x + this.width) {
        if (this.showCursor && selectionStart === selectionEnd) {
          ctx.fillStyle = theme.primary;
          ctx.fillRect(visualCursorX - 1, cursorY, 2, cursorHeight);
        }
      }

      // Teardrop handles
      ctx.fillStyle = theme.primary;
      const handleRadius = 10;
      const tipY = cursorY + cursorHeight;
      
      if (selectionStart !== selectionEnd) {
        // Draw start handle
        const startX = this.charPositions[Math.min(selectionStart, selectionEnd)] - this.scrollX;
        if (startX >= this.x && startX <= this.x + this.width) {
          ctx.beginPath();
          ctx.arc(startX, tipY + handleRadius, handleRadius, 0, Math.PI);
          ctx.lineTo(startX, tipY);
          ctx.closePath();
          ctx.fill();
        }
        
        // Draw end handle
        const endX = this.charPositions[Math.max(selectionStart, selectionEnd)] - this.scrollX;
        if (endX >= this.x && endX <= this.x + this.width) {
          ctx.beginPath();
          ctx.arc(endX, tipY + handleRadius, handleRadius, 0, Math.PI);
          ctx.lineTo(endX, tipY);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // Single handle
        if (visualCursorX >= this.x && visualCursorX <= this.x + this.width) {
          ctx.beginPath();
          ctx.arc(visualCursorX, tipY + handleRadius, handleRadius, 0, Math.PI);
          ctx.lineTo(visualCursorX, tipY);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Tooltip
      if (this.showTooltip) {
        const ttX = Math.max(this.x, Math.min(this.x + this.width - 150, visualCursorX - 75));
        const ttY = this.y - 50;
        
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;
        
        ctx.fillStyle = theme.surfaceVariant;
        ctx.beginPath();
        ctx.roundRect(ttX, ttY, 150, 40, 8);
        ctx.fill();
        
        ctx.shadowColor = 'transparent';
        
        ctx.fillStyle = theme.onSurface;
        ctx.font = '500 14px "Google Sans Flex", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Cut', ttX + 25, ttY + 20);
        ctx.fillText('Copy', ttX + 75, ttY + 20);
        ctx.fillText('Paste', ttX + 125, ttY + 20);
        ctx.textAlign = 'left';
        
        ctx.fillStyle = theme.onSurfaceVariant;
        ctx.fillRect(ttX + 50, ttY + 10, 1, 20);
        ctx.fillRect(ttX + 100, ttY + 10, 1, 20);
      }

      engine.requestRender();
    }
  }
}
