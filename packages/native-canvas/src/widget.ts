import { Signal } from './reactivity';

function bindProp(widget: any, targetObj: any, propName: string, val: any) {
    if (val && typeof val.subscribe === 'function') {
        targetObj[propName] = val.value;
        var unsub = val.subscribe(function(newVal: any) {
            targetObj[propName] = newVal;
        });
        widget.cleanups.push(unsub);
    } else {
        targetObj[propName] = val;
    }
}

export function Widget() {
    this._children = [];
    this._parent = null;
    this._style = {
        width: undefined,
        height: undefined,
        flex: undefined,
        padding: [0, 0, 0, 0],
        bg: 'transparent',
        radius: 0,
        borderWidth: 0,
        borderColor: 'transparent',
        direction: 'col',
        alignItems: 'stretch', // Default to stretch like CSS flexbox
        justifyContent: 'start',
        gap: 0,
        scrollable: false,
        
        rippleEnabled: false,
        rippleColor: 'rgba(255, 255, 255, 0.2)',
        rippleSpeed: 1.0,

        x: 0, y: 0, w: 0, h: 0, scrollY: 0
    };
    this._events = {};
    this.cleanups = [];
    this._isPressed = false;
    this._isHovered = false;
    this._ripples = [];
}

Widget.prototype.w = function(val: any) { bindProp(this, this._style, 'width', val); return this; };
Widget.prototype.h = function(val: any) { bindProp(this, this._style, 'height', val); return this; };
Widget.prototype.flex = function(val: any) { bindProp(this, this._style, 'flex', val); return this; };
Widget.prototype.bg = function(val: any) { bindProp(this, this._style, 'bg', val); return this; };
Widget.prototype.pad = function(v1: any, v2?: any, v3?: any, v4?: any) {
    if (v1 && typeof v1.subscribe === 'function') {
        var self = this;
        this._style.padding = [v1.value, v1.value, v1.value, v1.value];
        var unsub = v1.subscribe(function(val: any) {
            self._style.padding = [val, val, val, val];
        });
        this.cleanups.push(unsub);
    } else {
        var p1 = v1 || 0;
        var p2 = v2 !== undefined ? v2 : p1;
        var p3 = v3 !== undefined ? v3 : p1;
        var p4 = v4 !== undefined ? v4 : p2;
        this._style.padding = [p1, p2, p3, p4];
    }
    return this;
};
Widget.prototype.radius = function(val: any) { bindProp(this, this._style, 'radius', val); return this; };
Widget.prototype.border = function(width: any, color: any) { 
    bindProp(this, this._style, 'borderWidth', width); 
    bindProp(this, this._style, 'borderColor', color); 
    return this; 
};
Widget.prototype.dir = function(val: any) { bindProp(this, this._style, 'direction', val); return this; };
Widget.prototype.align = function(val: any) { bindProp(this, this._style, 'alignItems', val); return this; };
Widget.prototype.justify = function(val: any) { bindProp(this, this._style, 'justifyContent', val); return this; };
Widget.prototype.gap = function(val: any) { bindProp(this, this._style, 'gap', val); return this; };
Widget.prototype.scroll = function(val?: any) { bindProp(this, this._style, 'scrollable', val !== false); return this; };
Widget.prototype.ripple = function(color?: string, speed?: number) { 
    this._style.rippleEnabled = true; 
    if (color) this._style.rippleColor = color; 
    if (speed !== undefined) this._style.rippleSpeed = speed;
    return this; 
};

Widget.prototype.child = function(childWidget: any) {
    if (childWidget) {
        childWidget._parent = this;
        this._children.push(childWidget);
    }
    return this;
};

Widget.prototype.children = function(childArray: any[]) {
    for (var i = 0; i < childArray.length; i++) {
        this.child(childArray[i]);
    }
    return this;
};

Widget.prototype.onPointerDown = function(fn: Function) { this._events.onPointerDown = fn; return this; };
Widget.prototype.onPointerUp = function(fn: Function) { this._events.onPointerUp = fn; return this; };
Widget.prototype.onPointerMove = function(fn: Function) { this._events.onPointerMove = fn; return this; };
Widget.prototype.onPointerEnter = function(fn: Function) { this._events.onPointerEnter = fn; return this; };
Widget.prototype.onPointerLeave = function(fn: Function) { this._events.onPointerLeave = fn; return this; };
Widget.prototype.onPressIn = function(fn: Function) { this._events.onPressIn = fn; return this; };
Widget.prototype.onPressOut = function(fn: Function) { this._events.onPressOut = fn; return this; };
Widget.prototype.onClick = function(fn: Function) { this._events.onClick = fn; return this; };
Widget.prototype.onPress = function(fn: Function) { this._events.onClick = fn; return this; }; // Alias for onClick
Widget.prototype.onLongPress = function(fn: Function) { this._events.onLongPress = fn; return this; };
Widget.prototype.whilePressed = function(intervalMs: number, fn: Function) { 
    this._events.whilePressed = { interval: intervalMs, fn: fn }; 
    return this; 
};

Widget.prototype.addRipple = function(x: number, y: number) {
    if (!this._style.rippleEnabled) return;
    this._ripples.push({
        x: x - this._style.x,
        y: y - this._style.y,
        radius: 0,
        targetRadius: Math.sqrt(Math.pow(this._style.w, 2) + Math.pow(this._style.h, 2)),
        alpha: 1,
        state: 'growing'
    });
};

Widget.prototype.fadeRipples = function() {
    for (var i = 0; i < this._ripples.length; i++) {
        this._ripples[i].state = 'fading';
    }
};

Widget.prototype.destroy = function() {
    for (var i = 0; i < this.cleanups.length; i++) {
        this.cleanups[i]();
    }
    this.cleanups = [];
    for (var j = 0; j < this._children.length; j++) {
        this._children[j].destroy();
    }
};

Widget.prototype.measure = function(ctx: CanvasRenderingContext2D, maxWidth: number, maxHeight: number) {
    var s = this._style;
    var pad = s.padding;
    var availW = s.width !== undefined ? s.width : Math.max(0, maxWidth - pad[1] - pad[3]);
    var availH = s.height !== undefined ? s.height : Math.max(0, maxHeight - pad[0] - pad[2]);

    var contentW = 0;
    var contentH = 0;
    var isRow = s.direction === 'row';
    
    // First pass: measure non-flex children
    var fixedMain = 0;
    var totalFlex = 0;
    for (var i = 0; i < this._children.length; i++) {
        var c = this._children[i];
        if (c._style.flex) {
            totalFlex += c._style.flex;
        } else {
            var size = c.measure(ctx, availW, availH);
            if (isRow) {
                fixedMain += size.w;
                contentH = Math.max(contentH, size.h);
            } else {
                fixedMain += size.h;
                contentW = Math.max(contentW, size.w);
            }
        }
    }

    var gapTotal = Math.max(0, this._children.length - 1) * s.gap;
    var remainingMain = Math.max(0, (isRow ? availW : availH) - fixedMain - gapTotal);

    // Provide content size for flex items
    if (isRow) contentW += fixedMain;
    else contentH += fixedMain;

    // Second pass: measure flex children
    if (totalFlex > 0) {
        for (var i = 0; i < this._children.length; i++) {
            var c = this._children[i];
            if (c._style.flex) {
                var flexMain = (c._style.flex / totalFlex) * remainingMain;
                var size = c.measure(
                    ctx, 
                    isRow ? flexMain : availW, 
                    isRow ? availH : flexMain
                );
                if (isRow) {
                    contentH = Math.max(contentH, size.h);
                    contentW += flexMain;
                } else {
                    contentW = Math.max(contentW, size.w);
                    contentH += flexMain;
                }
            }
        }
    }
    
    contentW += gapTotal;
    contentH += gapTotal;
    
    s.w = s.width !== undefined ? s.width : (contentW + pad[1] + pad[3]);
    s.h = s.height !== undefined ? s.height : (contentH + pad[0] + pad[2]);
    
    if (s.flex) {
        if (maxWidth !== Infinity && s.width === undefined) s.w = maxWidth;
        if (maxHeight !== Infinity && s.height === undefined) s.h = maxHeight;
    }

    // Defensive NaN check
    if (isNaN(s.w)) s.w = 0;
    if (isNaN(s.h)) s.h = 0;

    return { w: s.w, h: s.h };
};

Widget.prototype.layout = function(x: number, y: number, w?: number, h?: number) {
    var s = this._style;
    s.x = x;
    s.y = y;
    if (w !== undefined) s.w = w;
    if (h !== undefined) s.h = h;
    
    var pad = s.padding;
    var innerX = x + pad[3];
    var innerY = y + pad[0];
    var innerW = Math.max(0, s.w - pad[1] - pad[3]);
    var innerH = Math.max(0, s.h - pad[0] - pad[2]);
    
    var isRow = s.direction === 'row';
    var crossSize = isRow ? innerH : innerW;
    var mainSize = isRow ? innerW : innerH;
    
    var totalFlex = 0;
    var fixedMainSize = 0;
    
    for (var i = 0; i < this._children.length; i++) {
        var c = this._children[i];
        if (c._style.flex) totalFlex += c._style.flex;
        else fixedMainSize += isRow ? c._style.w : c._style.h;
    }
    
    var gapTotal = Math.max(0, this._children.length - 1) * s.gap;
    var remainingMain = Math.max(0, mainSize - fixedMainSize - gapTotal);
    
    var currentMain = isRow ? innerX : innerY;
    
    if (totalFlex === 0 && remainingMain > 0) {
        if (s.justifyContent === 'center') currentMain += remainingMain / 2;
        else if (s.justifyContent === 'end') currentMain += remainingMain;
        else if (s.justifyContent === 'between' && this._children.length > 1) {
            s.gap = remainingMain / (this._children.length - 1);
        } else if (s.justifyContent === 'around' && this._children.length > 0) {
            var step = remainingMain / this._children.length;
            currentMain += step / 2;
            s.gap = step;
        }
    }
    
    for (var i = 0; i < this._children.length; i++) {
        var c = this._children[i];
        var childMain = 0;
        
        if (c._style.flex) {
            childMain = (c._style.flex / totalFlex) * remainingMain;
        } else {
            childMain = isRow ? c._style.w : c._style.h;
        }
        
        var childCross = isRow ? c._style.h : c._style.w;
        var currentCross = isRow ? innerY : innerX;
        
        // Stretch is default
        if (s.alignItems === 'stretch') {
            childCross = crossSize;
        } else if (s.alignItems === 'center') {
            currentCross += (crossSize - childCross) / 2;
        } else if (s.alignItems === 'end') {
            currentCross += (crossSize - childCross);
        }
        
        if (isRow) c.layout(currentMain, currentCross, childMain, childCross);
        else c.layout(currentCross, currentMain, childCross, childMain);
        
        currentMain += childMain + s.gap;
    }
};

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    if (!radius) {
        ctx.rect(x, y, width, height);
        return;
    }
    radius = Math.min(radius, width / 2, height / 2);
    if (ctx.roundRect) {
        ctx.roundRect(x, y, width, height, radius);
        return;
    }
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
}

Widget.prototype.render = function(ctx: CanvasRenderingContext2D, dt: number, engine: any) {
    var s = this._style;
    if (isNaN(s.w) || isNaN(s.h) || s.w <= 0 || s.h <= 0) return;

    if (s.bg !== 'transparent' || s.borderWidth > 0) {
        ctx.beginPath();
        drawRoundRect(ctx, s.x, s.y, s.w, s.h, s.radius);
        if (s.bg !== 'transparent') {
            ctx.fillStyle = s.bg;
            ctx.fill();
        }
        if (s.borderWidth > 0) {
            ctx.strokeStyle = s.borderColor;
            ctx.lineWidth = s.borderWidth;
            ctx.stroke();
        }
    }
    
    if (this._isPressed && this._events.onClick && !s.rippleEnabled) {
        ctx.beginPath();
        drawRoundRect(ctx, s.x, s.y, s.w, s.h, s.radius);
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fill();
    }
    
    var clip = s.scrollable || s.radius > 0 || this._ripples.length > 0;
    if (clip) {
        ctx.save();
        ctx.beginPath();
        drawRoundRect(ctx, s.x, s.y, s.w, s.h, s.radius);
        ctx.clip();
    }

    if (this._ripples.length > 0) {
        var spd = s.rippleSpeed || 1.0;
        for (var r = 0; r < this._ripples.length; r++) {
            var ripple = this._ripples[r];
            if (ripple.state === 'growing') {
                ripple.radius += (ripple.targetRadius - ripple.radius) * 10 * spd * dt + 50 * spd * dt;
                if (ripple.radius > ripple.targetRadius) ripple.radius = ripple.targetRadius;
            } else {
                ripple.radius += (ripple.targetRadius - ripple.radius) * 15 * spd * dt + 200 * spd * dt;
                ripple.alpha -= 2 * spd * dt;
            }
            
            ctx.fillStyle = s.rippleColor;
            ctx.globalAlpha = Math.max(0, ripple.alpha);
            ctx.beginPath();
            ctx.arc(s.x + ripple.x, s.y + ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // Clean up faded ripples
        var oldLen = this._ripples.length;
        this._ripples = this._ripples.filter(function(r: any) { return r.alpha > 0; });
        if (this._ripples.length > 0) engine.requestRender();
    }

    if (s.scrollable) {
        ctx.translate(0, -s.scrollY);
    }

    for (var i = 0; i < this._children.length; i++) {
        this._children[i].render(ctx, dt, engine);
    }
    
    if (clip) {
        ctx.restore();
    }
};

Widget.prototype.hitTest = function(x: number, y: number): any {
    var s = this._style;
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) {
        var localY = y;
        if (s.scrollable) localY += s.scrollY;
        
        for (var i = this._children.length - 1; i >= 0; i--) {
            var hit = this._children[i].hitTest(x, localY);
            if (hit) return hit;
        }
        return this;
    }
    return null;
};

// --- BASE COMPONENTS FACTORIES ---

export function Box() {
    return new (Widget as any)();
}

export function TextWidget(textStr: any) {
    Widget.call(this);
    this._text = '';
    bindProp(this, this, '_text', textStr);
    
    this._textStyle = {
        color: 'black',
        size: 14,
        font: 'sans-serif',
        weight: 'normal',
        align: 'left', // 'left', 'center', 'right'
        baseline: 'middle' // Adjusted for better vertical centering
    };
}
TextWidget.prototype = Object.create(Widget.prototype);
TextWidget.prototype.constructor = TextWidget;

TextWidget.prototype.col = function(val: any) { bindProp(this, this._textStyle, 'color', val); return this; };
TextWidget.prototype.sz = function(val: any) { bindProp(this, this._textStyle, 'size', val); return this; };
TextWidget.prototype.font = function(val: any) { bindProp(this, this._textStyle, 'font', val); return this; };
TextWidget.prototype.bold = function() { this._textStyle.weight = 'bold'; return this; };
TextWidget.prototype.center = function() { this._textStyle.align = 'center'; return this; };

TextWidget.prototype.measure = function(ctx: CanvasRenderingContext2D, maxWidth: number, maxHeight: number) {
    ctx.font = this._textStyle.weight + ' ' + this._textStyle.size + 'px ' + this._textStyle.font;
    var safeText = this._text !== undefined && this._text !== null ? String(this._text) : '';
    var metrics = ctx.measureText(safeText);
    var height = this._textStyle.size;
    
    var s = this._style;
    var pad = s.padding;
    s.w = s.width !== undefined ? s.width : (metrics.width + pad[1] + pad[3]);
    s.h = s.height !== undefined ? s.height : (height + pad[0] + pad[2]);
    if (isNaN(s.w)) s.w = 0;
    if (isNaN(s.h)) s.h = 0;
    return { w: s.w, h: s.h };
};

TextWidget.prototype.render = function(ctx: CanvasRenderingContext2D, dt: number, engine: any) {
    Widget.prototype.render.call(this, ctx, dt, engine); // Render background if any
    var s = this._style;
    if (s.w <= 0 || s.h <= 0) return;

    ctx.fillStyle = this._textStyle.color;
    ctx.font = this._textStyle.weight + ' ' + this._textStyle.size + 'px ' + this._textStyle.font;
    ctx.textAlign = this._textStyle.align;
    ctx.textBaseline = this._textStyle.baseline;
    
    var tx = s.x + s.padding[3];
    if (this._textStyle.align === 'center') {
        tx = s.x + s.w / 2;
    }
    var ty = s.y + s.h / 2; // Center vertically in its box
    
    var safeText = this._text !== undefined && this._text !== null ? String(this._text) : '';
    ctx.fillText(safeText, tx, ty);
};

export function Text(textStr: any) {
    return new (TextWidget as any)(textStr);
}

// Touchable is just a Box that defaults to a pointer cursor in a real DOM, but here it's just semantic
export function Touchable() {
    var w = new (Widget as any)();
    // Default styles for touchable if any
    return w;
}
