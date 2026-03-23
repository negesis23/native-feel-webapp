var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { UIComponent } from '../core/component';
var TextField = /** @class */ (function (_super) {
    __extends(TextField, _super);
    function TextField() {
        var _this = _super.call(this) || this;
        _this.value = '';
        _this.placeholder = '';
        _this.multiline = false;
        _this.isTextInput = true;
        _this.cursorTimer = 0;
        _this.showCursor = true;
        _this.cursorIndex = 0;
        _this.charPositions = [];
        _this.reportedValues = [];
        _this.showTooltip = false;
        _this.draggingHandle = null;
        _this.scrollX = 0;
        _this.scrollY = 0;
        _this.consumedClick = false;
        _this.onPointerDown = function (x, y, engine) {
            var _a, _b;
            var textInput = engine ? engine.textInput : null;
            var selectionStart = this.cursorIndex;
            var selectionEnd = this.cursorIndex;
            if (textInput && document.activeElement === textInput) {
                selectionStart = (_a = textInput.selectionStart) !== null && _a !== void 0 ? _a : this.cursorIndex;
                selectionEnd = (_b = textInput.selectionEnd) !== null && _b !== void 0 ? _b : this.cursorIndex;
            }
            var cursorY = this.y + this.height / 2 - 10;
            var cursorHeight = 20;
            var tipY = cursorY + cursorHeight;
            var handleRadius = 10;
            // Check if clicking on handles
            if (selectionStart !== selectionEnd) {
                var startPos = this.charPositions[Math.min(selectionStart, selectionEnd)];
                var startX = startPos.x - this.scrollX;
                var startY = startPos.y - 10 - this.scrollY;
                var startTipY = startY + cursorHeight;
                var endPos = this.charPositions[Math.max(selectionStart, selectionEnd)];
                var endX = endPos.x - this.scrollX;
                var endY = endPos.y - 10 - this.scrollY;
                var endTipY = endY + cursorHeight;
                if (Math.sqrt(Math.pow(x - (startX - handleRadius), 2) + Math.pow(y - (startTipY + handleRadius), 2)) < handleRadius * 2) {
                    this.draggingHandle = 'start';
                    this.consumedClick = true;
                    return;
                }
                if (Math.sqrt(Math.pow(x - (endX + handleRadius), 2) + Math.pow(y - (endTipY + handleRadius), 2)) < handleRadius * 2) {
                    this.draggingHandle = 'end';
                    this.consumedClick = true;
                    return;
                }
            }
            else if (this.isFocused) {
                var cursorPos = this.charPositions[this.cursorIndex] || { x: this.x + 16, y: this.y + (this.multiline ? 24 : this.height / 2) };
                var visualCursorX = cursorPos.x - this.scrollX;
                var cursorY_1 = cursorPos.y - 10 - this.scrollY;
                var tipY_1 = cursorY_1 + cursorHeight;
                if (Math.sqrt(Math.pow(x - visualCursorX, 2) + Math.pow(y - (tipY_1 + handleRadius * 1.5), 2)) < handleRadius * 2) {
                    this.draggingHandle = 'cursor';
                    this.consumedClick = true;
                    return;
                }
            }
            // Check Tooltip click
            if (this.showTooltip) {
                var cursorPos = this.charPositions[this.cursorIndex] || { x: this.x + 16, y: this.y + (this.multiline ? 24 : this.height / 2) };
                var visualCursorX = cursorPos.x - this.scrollX;
                var ttWidth = 220;
                var ttX = Math.max(this.x, Math.min(this.x + this.width - ttWidth, visualCursorX - ttWidth / 2));
                var ttY = this.y - 50;
                if (x >= ttX && x <= ttX + ttWidth && y >= ttY && y <= ttY + 40) {
                    this.consumedClick = true;
                    var actionX = x - ttX;
                    if (actionX < 50) { // Cut
                        if (selectionStart !== selectionEnd) {
                            var start = Math.min(selectionStart, selectionEnd);
                            var end = Math.max(selectionStart, selectionEnd);
                            var selectedText = this.value.substring(start, end);
                            navigator.clipboard.writeText(selectedText);
                            this.value = this.value.slice(0, start) + this.value.slice(end);
                            this.cursorIndex = start;
                            if (this.onChange)
                                this.onChange(this.value);
                            if (engine) {
                                engine.textInput.value = this.value;
                                engine.textInput.setSelectionRange(start, start);
                            }
                        }
                    }
                    else if (actionX < 100) { // Copy
                        if (selectionStart !== selectionEnd) {
                            var start = Math.min(selectionStart, selectionEnd);
                            var end = Math.max(selectionStart, selectionEnd);
                            var selectedText = this.value.substring(start, end);
                            navigator.clipboard.writeText(selectedText);
                        }
                    }
                    else if (actionX < 150) { // Paste
                        navigator.clipboard.readText().then(function (text) {
                            var start = Math.min(selectionStart, selectionEnd);
                            var end = Math.max(selectionStart, selectionEnd);
                            this.value = this.value.slice(0, start) + text + this.value.slice(end);
                            this.cursorIndex = start + text.length;
                            if (this.onChange)
                                this.onChange(this.value);
                            if (engine) {
                                engine.textInput.value = this.value;
                                engine.textInput.setSelectionRange(this.cursorIndex, this.cursorIndex);
                                engine.requestRender();
                            }
                        }.bind(this));
                    }
                    else { // Select All
                        if (engine) {
                            engine.textInput.setSelectionRange(0, this.value.length);
                            this.cursorIndex = this.value.length;
                        }
                    }
                    this.showTooltip = false;
                    if (engine)
                        engine.requestRender();
                    return;
                }
            }
            this.showTooltip = false;
            if (!this.isFocused) {
                this.isFocused = true;
                if (engine)
                    engine.requestRender();
            }
            // Long press for tooltip and smart selection
            clearTimeout(this.pressTimer);
            this.pressTimer = setTimeout(function () {
                this.consumedClick = true;
                this.showTooltip = true;
                // Find closest character for cursor
                if (this.charPositions.length > 0) {
                    var closestDist = Infinity;
                    var closestIdx = 0;
                    for (var i = 0; i < this.charPositions.length; i++) {
                        var pos = this.charPositions[i];
                        var dist = Math.sqrt(Math.pow(x + this.scrollX - pos.x, 2) + Math.pow(y + this.scrollY - pos.y, 2));
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestIdx = i;
                        }
                    }
                    // Smart selection: select the word around closestIdx
                    var text = this.value;
                    var start = closestIdx;
                    var end = closestIdx;
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
                            engine.textInput.style.display = 'block';
                            if (engine.textInput.value !== this.value) {
                                engine.textInput.value = this.value || '';
                            }
                            engine.textInput.focus();
                            engine.textInput.setSelectionRange(start, end);
                        }
                    }
                    else {
                        this.cursorIndex = closestIdx;
                        if (engine) {
                            engine.textInput.style.display = 'block';
                            if (engine.textInput.value !== this.value) {
                                engine.textInput.value = this.value || '';
                            }
                            engine.textInput.focus();
                            engine.textInput.setSelectionRange(closestIdx, closestIdx);
                        }
                    }
                }
                if (engine)
                    engine.requestRender();
            }.bind(this), 500);
        }.bind(_this);
        _this.onPointerMove = function (x, y, engine) {
            var _a, _b;
            if (this.draggingHandle && engine) {
                var closestDist = Infinity;
                var closestIdx = 0;
                for (var i = 0; i < this.charPositions.length; i++) {
                    var pos = this.charPositions[i];
                    var dist = Math.sqrt(Math.pow(x + this.scrollX - pos.x, 2) + Math.pow(y + this.scrollY - pos.y, 2));
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestIdx = i;
                    }
                }
                var textInput = engine.textInput;
                var newStart = (_a = textInput.selectionStart) !== null && _a !== void 0 ? _a : 0;
                var newEnd = (_b = textInput.selectionEnd) !== null && _b !== void 0 ? _b : 0;
                if (this.draggingHandle === 'cursor') {
                    newStart = closestIdx;
                    newEnd = closestIdx;
                }
                else if (this.draggingHandle === 'start') {
                    if (closestIdx > newEnd) {
                        this.draggingHandle = 'end';
                        newStart = newEnd;
                        newEnd = closestIdx;
                    }
                    else {
                        newStart = closestIdx;
                    }
                }
                else {
                    if (closestIdx < newStart) {
                        this.draggingHandle = 'start';
                        newEnd = newStart;
                        newStart = closestIdx;
                    }
                    else {
                        newEnd = closestIdx;
                    }
                }
                textInput.setSelectionRange(newStart, newEnd, this.draggingHandle === 'start' ? 'backward' : 'forward');
                this.cursorIndex = closestIdx;
                engine.requestRender();
                return;
            }
            if (engine && engine.hasDragged) {
                clearTimeout(this.pressTimer);
            }
        }.bind(_this);
        _this.onPointerUp = function () {
            this.draggingHandle = null;
            clearTimeout(this.pressTimer);
        }.bind(_this);
        _this.onClick = function (x, y, engine) {
            if (this.consumedClick) {
                this.consumedClick = false;
                return;
            }
            this.isFocused = true;
            // Find closest character for cursor
            if (this.charPositions.length > 0) {
                var closestDist = Infinity;
                var closestIdx = 0;
                for (var i = 0; i < this.charPositions.length; i++) {
                    var pos = this.charPositions[i];
                    var dist = Math.sqrt(Math.pow(x + this.scrollX - pos.x, 2) + Math.pow(y + this.scrollY - pos.y, 2));
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestIdx = i;
                    }
                }
                this.cursorIndex = closestIdx;
            }
            if (engine) {
                setTimeout(function () {
                    engine.textInput.setSelectionRange(this.cursorIndex, this.cursorIndex);
                }.bind(this), 10);
                engine.requestRender();
            }
        }.bind(_this);
        return _this;
    }
    TextField.prototype.hitTest = function (x, y) {
        // Check tooltip bounds first if visible
        if (this.showTooltip) {
            var cursorPos = this.charPositions[this.cursorIndex] || { x: this.x + 16, y: this.y + (this.multiline ? 24 : this.height / 2) };
            var visualCursorX = cursorPos.x - this.scrollX;
            var ttWidth = 220;
            var ttX = Math.max(this.x, Math.min(this.x + this.width - ttWidth, visualCursorX - ttWidth / 2));
            var ttY = this.y - 50;
            if (x >= ttX && x <= ttX + ttWidth && y >= ttY && y <= ttY + 40) {
                return this;
            }
        }
        // Check handles
        if (this.isFocused) {
            var handleRadius = 10;
            var cursorHeight = 20;
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
    };
    TextField.prototype.measure = function (ctx, constraints) {
        return { width: constraints.maxWidth, height: this.multiline ? 120 : 56 };
    };
    TextField.prototype.render = function (ctx, theme, dt, engine) {
        var _a, _b;
        ctx.fillStyle = theme.surfaceVariant;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, [4, 4, 0, 0]);
        ctx.fill();
        ctx.fillStyle = this.isFocused ? theme.primary : theme.onSurfaceVariant;
        ctx.fillRect(this.x, this.y + this.height - (this.isFocused ? 2 : 1), this.width, this.isFocused ? 2 : 1);
        ctx.font = '400 16px "Google Sans", sans-serif';
        ctx.textBaseline = 'middle';
        var currentX = this.x + 16;
        var currentY = this.y + (this.multiline ? 24 : this.height / 2);
        var lineHeight = 24;
        this.charPositions = [{ x: currentX, y: currentY }];
        // Calculate char positions without rendering yet
        for (var i = 0; i < this.value.length; i++) {
            var char = this.value[i];
            if (char === '\n') {
                currentX = this.x + 16;
                currentY += lineHeight;
            }
            else {
                currentX += ctx.measureText(char).width;
            }
            this.charPositions.push({ x: currentX, y: currentY });
        }
        // Draw selection highlight
        var selectionStart = this.cursorIndex;
        var selectionEnd = this.cursorIndex;
        if (engine && engine.textInput && document.activeElement === engine.textInput && this.isFocused) {
            selectionStart = (_a = engine.textInput.selectionStart) !== null && _a !== void 0 ? _a : this.cursorIndex;
            selectionEnd = (_b = engine.textInput.selectionEnd) !== null && _b !== void 0 ? _b : this.cursorIndex;
        }
        // Clamp to prevent out of bounds if value is out of sync momentarily
        var maxIdx = this.charPositions.length - 1;
        selectionStart = Math.min(Math.max(0, selectionStart), maxIdx);
        selectionEnd = Math.min(Math.max(0, selectionEnd), maxIdx);
        this.cursorIndex = Math.min(Math.max(0, this.cursorIndex), maxIdx);
        // Adjust scrollX and scrollY to keep cursor visible
        var cursorPos = this.charPositions[this.cursorIndex];
        var padding = 16;
        if (cursorPos.x - this.scrollX > this.x + this.width - padding) {
            this.scrollX = cursorPos.x - (this.x + this.width - padding);
        }
        else if (cursorPos.x - this.scrollX < this.x + padding) {
            this.scrollX = Math.max(0, cursorPos.x - (this.x + padding));
        }
        if (this.multiline) {
            if (cursorPos.y - this.scrollY > this.y + this.height - padding) {
                this.scrollY = cursorPos.y - (this.y + this.height - padding);
            }
            else if (cursorPos.y - this.scrollY < this.y + padding) {
                this.scrollY = Math.max(0, cursorPos.y - (this.y + padding));
            }
        }
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.clip();
        if (selectionStart !== selectionEnd) {
            ctx.fillStyle = theme.primaryContainer || 'rgba(103, 80, 164, 0.3)';
            var startIdx = Math.min(selectionStart, selectionEnd);
            var endIdx = Math.max(selectionStart, selectionEnd);
            var currentLineY = this.charPositions[startIdx].y;
            var lineStartX = this.charPositions[startIdx].x;
            for (var i = startIdx; i <= endIdx; i++) {
                var pos = this.charPositions[i];
                if (pos.y !== currentLineY || i === endIdx) {
                    // Draw previous line
                    var lineEndX = i === endIdx ? pos.x : this.x + this.width - 16;
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
        }
        else {
            ctx.fillStyle = theme.onSurface;
            currentX = this.x + 16;
            currentY = this.y + (this.multiline ? 24 : this.height / 2);
            for (var i = 0; i < this.value.length; i++) {
                var char = this.value[i];
                if (char === '\n') {
                    currentX = this.x + 16;
                    currentY += lineHeight;
                }
                else {
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
            var visualCursorX = cursorPos.x - this.scrollX;
            var cursorY = cursorPos.y - 10 - this.scrollY;
            var cursorHeight = 20;
            if (visualCursorX >= this.x && visualCursorX <= this.x + this.width && cursorY >= this.y && cursorY <= this.y + this.height) {
                if (this.showCursor && selectionStart === selectionEnd) {
                    ctx.fillStyle = theme.primary;
                    ctx.fillRect(visualCursorX - 1, cursorY, 2, cursorHeight);
                }
            }
            // Teardrop handles
            ctx.fillStyle = theme.primary;
            var handleRadius = 10;
            if (selectionStart !== selectionEnd) {
                // Draw start handle (points top-right)
                var startPos = this.charPositions[Math.min(selectionStart, selectionEnd)];
                var startX = startPos.x - this.scrollX;
                var startY = startPos.y - 10 - this.scrollY;
                var startTipY = startY + cursorHeight;
                if (startX >= this.x && startX <= this.x + this.width && startY >= this.y && startY <= this.y + this.height) {
                    ctx.beginPath();
                    ctx.arc(startX - handleRadius, startTipY + handleRadius, handleRadius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillRect(startX - handleRadius, startTipY, handleRadius, handleRadius);
                }
                // Draw end handle (points top-left)
                var endPos = this.charPositions[Math.max(selectionStart, selectionEnd)];
                var endX = endPos.x - this.scrollX;
                var endY = endPos.y - 10 - this.scrollY;
                var endTipY = endY + cursorHeight;
                if (endX >= this.x && endX <= this.x + this.width && endY >= this.y && endY <= this.y + this.height) {
                    ctx.beginPath();
                    ctx.arc(endX + handleRadius, endTipY + handleRadius, handleRadius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillRect(endX, endTipY, handleRadius, handleRadius);
                }
            }
            else {
                // Single handle (points top-center)
                var tipY = cursorY + cursorHeight;
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
                var ttWidth = 220;
                var ttX = Math.max(this.x, Math.min(this.x + this.width - ttWidth, visualCursorX - ttWidth / 2));
                var ttY = this.y - 50;
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
    };
    return TextField;
}(UIComponent));
export { TextField };
