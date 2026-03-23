import { UIComponent, BoxConstraints } from '../core/component';
import { Theme } from './theme';
import { FrameworkEngine } from './engine';

export class TextField extends UIComponent {
  value: string = '';
  placeholder: string = '';
  onChange?: (val: string) => void;
  onSubmit?: (val: string) => void;
  multiline: boolean = false;
  isTextInput = true;
  
  cursorTimer: number = 0;
  showCursor: boolean = true;
  cursorIndex: number = 0;
  charPositions: {x: number, y: number}[] = [];
  reportedValues: Set<string> = new Set();
  
  showTooltip: boolean = false;
  private pressTimer: any;
  private draggingHandle: 'start' | 'end' | 'cursor' | null = null;
  
  private scrollX: number = 0;
  private scrollY: number = 0;
  private consumedClick: boolean = false;

  hitTest(x: number, y: number): UIComponent | null {
    // Check tooltip bounds first if visible
    if (this.showTooltip) {
      const cursorPos = this.charPositions[this.cursorIndex] || {x: this.x + 16, y: this.y + (this.multiline ? 24 : this.height / 2)};
      const visualCursorX = cursorPos.x - this.scrollX;
      const ttWidth = 220;
      const ttX = Math.max(this.x, Math.min(this.x + this.width - ttWidth, visualCursorX - ttWidth / 2));
      const ttY = this.y - 50;
      if (x >= ttX && x <= ttX + ttWidth && y >= ttY && y <= ttY + 40) {
        return this;
      }
    }
    
    // Check handles
    if (this.isFocused) {
      const handleRadius = 10;
      const cursorHeight = 20;
      // We just expand the hit area slightly downwards to catch handles
      if (x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height + handleRadius * 2 + cursorHeight) {
        return this;
      }
    }

    // Default bounds
    if (x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height) {
      return this;
    }
    return null;
  }

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
        const startPos = this.charPositions[Math.min(selectionStart, selectionEnd)];
        const startX = startPos.x - this.scrollX;
        const startY = startPos.y - 10 - this.scrollY;
        const startTipY = startY + cursorHeight;
        
        const endPos = this.charPositions[Math.max(selectionStart, selectionEnd)];
        const endX = endPos.x - this.scrollX;
        const endY = endPos.y - 10 - this.scrollY;
        const endTipY = endY + cursorHeight;
        
        if (Math.hypot(x - (startX - handleRadius), y - (startTipY + handleRadius)) < handleRadius * 2) {
          this.draggingHandle = 'start';
          this.consumedClick = true;
          return;
        }
        if (Math.hypot(x - (endX + handleRadius), y - (endTipY + handleRadius)) < handleRadius * 2) {
          this.draggingHandle = 'end';
          this.consumedClick = true;
          return;
        }
      } else if (this.isFocused) {
        const cursorPos = this.charPositions[this.cursorIndex] || {x: this.x + 16, y: this.y + (this.multiline ? 24 : this.height / 2)};
        const visualCursorX = cursorPos.x - this.scrollX;
        const cursorY = cursorPos.y - 10 - this.scrollY;
        const tipY = cursorY + cursorHeight;
        
        if (Math.hypot(x - visualCursorX, y - (tipY + handleRadius * 1.5)) < handleRadius * 2) {
          this.draggingHandle = 'cursor';
          this.consumedClick = true;
          return;
        }
      }

      // Check Tooltip click
      if (this.showTooltip) {
        const cursorPos = this.charPositions[this.cursorIndex] || {x: this.x + 16, y: this.y + (this.multiline ? 24 : this.height / 2)};
        const visualCursorX = cursorPos.x - this.scrollX;
        const ttWidth = 220;
        const ttX = Math.max(this.x, Math.min(this.x + this.width - ttWidth, visualCursorX - ttWidth / 2));
        const ttY = this.y - 50;
        if (x >= ttX && x <= ttX + ttWidth && y >= ttY && y <= ttY + 40) {
          this.consumedClick = true;
          const actionX = x - ttX;
          if (actionX < 50) { // Cut
            if (selectionStart !== selectionEnd) {
              const start = Math.min(selectionStart, selectionEnd);
              const end = Math.max(selectionStart, selectionEnd);
              const selectedText = this.value.substring(start, end);
              navigator.clipboard.writeText(selectedText);
              this.value = this.value.slice(0, start) + this.value.slice(end);
              this.cursorIndex = start;
              if (this.onChange) this.onChange(this.value);
              if (engine) {
                (engine as any).textInput.value = this.value;
                (engine as any).textInput.setSelectionRange(start, start);
              }
            }
          } else if (actionX < 100) { // Copy
            if (selectionStart !== selectionEnd) {
              const start = Math.min(selectionStart, selectionEnd);
              const end = Math.max(selectionStart, selectionEnd);
              const selectedText = this.value.substring(start, end);
              navigator.clipboard.writeText(selectedText);
            }
          } else if (actionX < 150) { // Paste
            navigator.clipboard.readText().then(text => {
              const start = Math.min(selectionStart, selectionEnd);
              const end = Math.max(selectionStart, selectionEnd);
              this.value = this.value.slice(0, start) + text + this.value.slice(end);
              this.cursorIndex = start + text.length;
              if (this.onChange) this.onChange(this.value);
              if (engine) {
                (engine as any).textInput.value = this.value;
                (engine as any).textInput.setSelectionRange(this.cursorIndex, this.cursorIndex);
                engine.requestRender();
              }
            });
          } else { // Select All
            if (engine) {
              (engine as any).textInput.setSelectionRange(0, this.value.length);
              this.cursorIndex = this.value.length;
            }
          }
          this.showTooltip = false;
          if (engine) engine.requestRender();
          return;
        }
      }
      
      this.showTooltip = false;

      if (!this.isFocused) {
        this.isFocused = true;
        if (engine) engine.requestRender();
      }

      // Long press for tooltip and smart selection
      clearTimeout(this.pressTimer);
      this.pressTimer = setTimeout(() => {
        this.consumedClick = true;
        this.showTooltip = true;
        
        // Find closest character for cursor
        if (this.charPositions.length > 0) {
          let closestDist = Infinity;
          let closestIdx = 0;
          for(let i=0; i<this.charPositions.length; i++) {
            const pos = this.charPositions[i];
            const dist = Math.hypot(x + this.scrollX - pos.x, y + this.scrollY - pos.y);
            if (dist < closestDist) {
              closestDist = dist;
              closestIdx = i;
            }
          }
          
          // Smart selection: select the word around closestIdx
          const text = this.value;
          let start = closestIdx;
          let end = closestIdx;
          
          // Expand left
          while (start > 0 && /\w/.test(text[start - 1])) {
            start--;
          }
          // Expand right
          while (end < text.length && /\w/.test(text[end])) {
            end++;
          }
          
          if (start !== end) {
            this.cursorIndex = end;
            if (engine) {
              (engine as any).textInput.style.display = 'block';
              if ((engine as any).textInput.value !== this.value) {
                (engine as any).textInput.value = this.value || '';
              }
              (engine as any).textInput.focus();
              (engine as any).textInput.setSelectionRange(start, end);
            }
          } else {
            this.cursorIndex = closestIdx;
            if (engine) {
              (engine as any).textInput.style.display = 'block';
              if ((engine as any).textInput.value !== this.value) {
                (engine as any).textInput.value = this.value || '';
              }
              (engine as any).textInput.focus();
              (engine as any).textInput.setSelectionRange(closestIdx, closestIdx);
            }
          }
        }
        
        if (engine) engine.requestRender();
      }, 500);
    };

    this.onPointerMove = (x, y, engine) => {
      if (this.draggingHandle && engine) {
        let closestDist = Infinity;
        let closestIdx = 0;
        for(let i=0; i<this.charPositions.length; i++) {
          const pos = this.charPositions[i];
          const dist = Math.hypot(x + this.scrollX - pos.x, y + this.scrollY - pos.y);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = i;
          }
        }
        
        const textInput = (engine as any).textInput;
        let newStart = textInput.selectionStart ?? 0;
        let newEnd = textInput.selectionEnd ?? 0;
        
        if (this.draggingHandle === 'cursor') {
          newStart = closestIdx;
          newEnd = closestIdx;
        } else if (this.draggingHandle === 'start') {
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
      if (this.consumedClick) {
        this.consumedClick = false;
        return;
      }
      this.isFocused = true;
      
      // Find closest character for cursor
      if (this.charPositions.length > 0) {
        let closestDist = Infinity;
        let closestIdx = 0;
        for(let i=0; i<this.charPositions.length; i++) {
          const pos = this.charPositions[i];
          const dist = Math.hypot(x + this.scrollX - pos.x, y + this.scrollY - pos.y);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = i;
          }
        }
        this.cursorIndex = closestIdx;
      }

      if (engine) {
        setTimeout(() => {
          (engine as any).textInput.setSelectionRange(this.cursorIndex, this.cursorIndex);
        }, 10);
        engine.requestRender();
      }
    };
  }

  measure(ctx: CanvasRenderingContext2D, constraints: BoxConstraints) {
    return { width: constraints.maxWidth, height: this.multiline ? 120 : 56 };
  }

  render(ctx: CanvasRenderingContext2D, theme: Theme, dt: number, engine: FrameworkEngine) {
    ctx.fillStyle = theme.surfaceVariant;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, [4, 4, 0, 0]);
    ctx.fill();

    ctx.fillStyle = this.isFocused ? theme.primary : theme.onSurfaceVariant;
    ctx.fillRect(this.x, this.y + this.height - (this.isFocused ? 2 : 1), this.width, this.isFocused ? 2 : 1);

    ctx.font = '400 16px "Google Sans", sans-serif';
    ctx.textBaseline = 'middle';
    
    let currentX = this.x + 16;
    let currentY = this.y + (this.multiline ? 24 : this.height / 2);
    const lineHeight = 24;
    
    this.charPositions = [{x: currentX, y: currentY}];
    
    // Calculate char positions without rendering yet
    for(let i=0; i<this.value.length; i++) {
      const char = this.value[i];
      if (char === '\n') {
        currentX = this.x + 16;
        currentY += lineHeight;
      } else {
        currentX += ctx.measureText(char).width;
      }
      this.charPositions.push({x: currentX, y: currentY});
    }

    // Draw selection highlight
    let selectionStart = this.cursorIndex;
    let selectionEnd = this.cursorIndex;
    if (engine && (engine as any).textInput && document.activeElement === (engine as any).textInput && this.isFocused) {
      selectionStart = (engine as any).textInput.selectionStart ?? this.cursorIndex;
      selectionEnd = (engine as any).textInput.selectionEnd ?? this.cursorIndex;
    }
    
    // Clamp to prevent out of bounds if value is out of sync momentarily
    const maxIdx = this.charPositions.length - 1;
    selectionStart = Math.min(Math.max(0, selectionStart), maxIdx);
    selectionEnd = Math.min(Math.max(0, selectionEnd), maxIdx);
    this.cursorIndex = Math.min(Math.max(0, this.cursorIndex), maxIdx);

    // Adjust scrollX and scrollY to keep cursor visible
    const cursorPos = this.charPositions[this.cursorIndex];
    const padding = 16;
    if (cursorPos.x - this.scrollX > this.x + this.width - padding) {
      this.scrollX = cursorPos.x - (this.x + this.width - padding);
    } else if (cursorPos.x - this.scrollX < this.x + padding) {
      this.scrollX = Math.max(0, cursorPos.x - (this.x + padding));
    }
    
    if (this.multiline) {
      if (cursorPos.y - this.scrollY > this.y + this.height - padding) {
        this.scrollY = cursorPos.y - (this.y + this.height - padding);
      } else if (cursorPos.y - this.scrollY < this.y + padding) {
        this.scrollY = Math.max(0, cursorPos.y - (this.y + padding));
      }
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.clip();

    if (selectionStart !== selectionEnd) {
      ctx.fillStyle = theme.primaryContainer || 'rgba(103, 80, 164, 0.3)';
      let startIdx = Math.min(selectionStart, selectionEnd);
      let endIdx = Math.max(selectionStart, selectionEnd);
      
      let currentLineY = this.charPositions[startIdx].y;
      let lineStartX = this.charPositions[startIdx].x;
      
      for (let i = startIdx; i <= endIdx; i++) {
        const pos = this.charPositions[i];
        if (pos.y !== currentLineY || i === endIdx) {
          // Draw previous line
          const lineEndX = i === endIdx ? pos.x : this.x + this.width - 16;
          ctx.fillRect(lineStartX - this.scrollX, currentLineY - 12 - this.scrollY, lineEndX - lineStartX, lineHeight);
          
          if (i !== endIdx) {
            currentLineY = pos.y;
            lineStartX = this.x + 16;
          }
        }
      }
    }

    if (this.value.length === 0) {
      ctx.fillStyle = theme.onSurfaceVariant;
      ctx.fillText(this.placeholder, this.x + 16 - this.scrollX, this.y + (this.multiline ? 24 : this.height / 2) - this.scrollY);
    } else {
      ctx.fillStyle = theme.onSurface;
      currentX = this.x + 16;
      currentY = this.y + (this.multiline ? 24 : this.height / 2);
      for(let i=0; i<this.value.length; i++) {
        const char = this.value[i];
        if (char === '\n') {
          currentX = this.x + 16;
          currentY += lineHeight;
        } else {
          ctx.fillText(char, currentX - this.scrollX, currentY - this.scrollY);
          currentX += ctx.measureText(char).width;
        }
      }
    }

    ctx.restore();

    if (this.isFocused) {
      this.cursorTimer += dt;
      if (this.cursorTimer > 0.5) {
        this.showCursor = !this.showCursor;
        this.cursorTimer = 0;
      }

      const visualCursorX = cursorPos.x - this.scrollX;
      const cursorY = cursorPos.y - 10 - this.scrollY;
      const cursorHeight = 20;
      
      if (visualCursorX >= this.x && visualCursorX <= this.x + this.width && cursorY >= this.y && cursorY <= this.y + this.height) {
        if (this.showCursor && selectionStart === selectionEnd) {
          ctx.fillStyle = theme.primary;
          ctx.fillRect(visualCursorX - 1, cursorY, 2, cursorHeight);
        }
      }

      // Teardrop handles
      ctx.fillStyle = theme.primary;
      const handleRadius = 10;
      
      if (selectionStart !== selectionEnd) {
        // Draw start handle (points top-right)
        const startPos = this.charPositions[Math.min(selectionStart, selectionEnd)];
        const startX = startPos.x - this.scrollX;
        const startY = startPos.y - 10 - this.scrollY;
        const startTipY = startY + cursorHeight;
        
        if (startX >= this.x && startX <= this.x + this.width && startY >= this.y && startY <= this.y + this.height) {
          ctx.beginPath();
          ctx.arc(startX - handleRadius, startTipY + handleRadius, handleRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(startX - handleRadius, startTipY, handleRadius, handleRadius);
        }
        
        // Draw end handle (points top-left)
        const endPos = this.charPositions[Math.max(selectionStart, selectionEnd)];
        const endX = endPos.x - this.scrollX;
        const endY = endPos.y - 10 - this.scrollY;
        const endTipY = endY + cursorHeight;
        
        if (endX >= this.x && endX <= this.x + this.width && endY >= this.y && endY <= this.y + this.height) {
          ctx.beginPath();
          ctx.arc(endX + handleRadius, endTipY + handleRadius, handleRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(endX, endTipY, handleRadius, handleRadius);
        }
      } else {
        // Single handle (points top-center)
        const tipY = cursorY + cursorHeight;
        if (visualCursorX >= this.x && visualCursorX <= this.x + this.width && cursorY >= this.y && cursorY <= this.y + this.height) {
          ctx.beginPath();
          ctx.arc(visualCursorX, tipY + handleRadius * 1.5, handleRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(visualCursorX, tipY);
          ctx.lineTo(visualCursorX - handleRadius, tipY + handleRadius * 1.5);
          ctx.lineTo(visualCursorX + handleRadius, tipY + handleRadius * 1.5);
          ctx.fill();
        }
      }

      // Tooltip
      if (this.showTooltip) {
        const ttWidth = 220;
        const ttX = Math.max(this.x, Math.min(this.x + this.width - ttWidth, visualCursorX - ttWidth / 2));
        const ttY = this.y - 50;
        
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;
        
        ctx.fillStyle = theme.surfaceVariant;
        ctx.beginPath();
        ctx.roundRect(ttX, ttY, ttWidth, 40, 8);
        ctx.fill();
        
        ctx.shadowColor = 'transparent';
        
        ctx.fillStyle = theme.onSurface;
        ctx.font = '500 14px "Google Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Cut', ttX + 25, ttY + 20);
        ctx.fillText('Copy', ttX + 75, ttY + 20);
        ctx.fillText('Paste', ttX + 125, ttY + 20);
        ctx.fillText('Select All', ttX + 185, ttY + 20);
        ctx.textAlign = 'left';
        
        ctx.fillStyle = theme.onSurfaceVariant;
        ctx.fillRect(ttX + 50, ttY + 10, 1, 20);
        ctx.fillRect(ttX + 100, ttY + 10, 1, 20);
        ctx.fillRect(ttX + 150, ttY + 10, 1, 20);
      }

      engine.requestRender();
    }
  }
}
