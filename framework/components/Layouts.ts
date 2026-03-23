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
var Column = /** @class */ (function (_super) {
    __extends(Column, _super);
    function Column() {
        var _this = _super.call(this) || this;
        _this.gap = 0;
        _this.radius = 0;
        _this.scrollable = false;
        _this.justifyContent = 'start';
        _this.alignItems = 'stretch';
        // Physics state
        _this.scrollY = 0;
        _this.velocityY = 0;
        _this.stretchAmount = 0;
        _this.contentHeight = 0;
        _this.isDragging = false;
        _this.lastY = 0;
        _this.lastTime = 0;
        _this.lastDeltaY = 0;
        _this.onPointerDown = function (x, y, engine) {
            if (!this.scrollable || this.contentHeight <= this.height)
                return;
            this.isDragging = true;
            this.lastY = y;
            this.lastTime = performance.now();
            this.velocityY = 0;
            if (engine)
                engine.requestRender();
        }.bind(_this);
        _this.onPointerMove = function (x, y, engine) {
            if (!this.scrollable || !this.isDragging || this.contentHeight <= this.height)
                return;
            var now = performance.now();
            var dt = (now - this.lastTime) / 1000;
            var dy = y - this.lastY;
            if (dt > 0) {
                // Smooth out velocity to prevent erratic spikes
                var currentVelocity = dy / dt;
                this.velocityY = this.velocityY * 0.4 + currentVelocity * 0.6;
            }
            this.lastY = y;
            this.lastTime = now;
            this.lastDeltaY = dy;
            var minScroll = Math.min(0, this.height - this.contentHeight);
            // 1. If currently stretched, absorb dy into stretch first
            if (this.stretchAmount > 0) { // Stretched at top
                var resistance = Math.max(0.05, 0.15 * (1 - this.stretchAmount / 150));
                this.stretchAmount += dy * resistance;
                if (this.stretchAmount < 0) {
                    this.scrollY += this.stretchAmount / resistance;
                    this.stretchAmount = 0;
                }
            }
            else if (this.stretchAmount < 0) { // Stretched at bottom
                var resistance = Math.max(0.05, 0.35 * (1 - Math.abs(this.stretchAmount) / 150));
                this.stretchAmount += dy * resistance;
                if (this.stretchAmount > 0) {
                    this.scrollY += this.stretchAmount / resistance;
                    this.stretchAmount = 0;
                }
            }
            else {
                // 2. Apply remaining dy to scroll
                if (dy !== 0) {
                    this.scrollY += dy;
                    // 3. If scroll hits bounds, convert overflow to stretch
                    if (this.scrollY > 0) {
                        this.stretchAmount += this.scrollY * 0.35;
                        if (this.stretchAmount > 100)
                            this.stretchAmount = 100 + (this.stretchAmount - 100) * 0.1;
                        this.scrollY = 0;
                    }
                    else if (this.scrollY < minScroll) {
                        this.stretchAmount += (this.scrollY - minScroll) * 0.35;
                        if (this.stretchAmount < -100)
                            this.stretchAmount = -100 + (this.stretchAmount + 100) * 0.1;
                        this.scrollY = minScroll;
                    }
                }
            }
            if (engine)
                engine.requestRender();
        }.bind(_this);
        _this.onPointerUp = function (x, y, engine) {
            if (!this.scrollable || !this.isDragging || this.contentHeight <= this.height)
                return;
            this.isDragging = false;
            if (engine)
                engine.requestRender();
        }.bind(_this);
        return _this;
    }
    Column.prototype.measure = function (ctx, constraints) {
        var totalHeight = this.padding.top + this.padding.bottom;
        var maxWidth = 0;
        var flexTotal = 0;
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (child.flex)
                flexTotal += child.flex;
            else {
                var size = child.measure(ctx, { minWidth: 0, maxWidth: constraints.maxWidth - this.padding.left - this.padding.right, minHeight: 0, maxHeight: Infinity });
                child.width = size.width;
                child.height = size.height;
                totalHeight += size.height;
                maxWidth = Math.max(maxWidth, size.width);
            }
        }
        totalHeight += Math.max(0, this.children.length - 1) * this.gap;
        if (flexTotal > 0 && constraints.maxHeight !== Infinity) {
            var remaining = Math.max(0, constraints.maxHeight - totalHeight);
            for (var _b = 0, _c = this.children; _b < _c.length; _b++) {
                var child = _c[_b];
                if (child.flex) {
                    var h = (child.flex / flexTotal) * remaining;
                    var size = child.measure(ctx, { minWidth: 0, maxWidth: constraints.maxWidth - this.padding.left - this.padding.right, minHeight: h, maxHeight: h });
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
    };
    Column.prototype.layout = function (x, y, width, height) {
        _super.prototype.layout.call(this, x, y, width, height);
        var cy = y + this.padding.top + (this.scrollable ? this.scrollY : 0);
        var cw = width - this.padding.left - this.padding.right;
        var totalContentHeight = 0;
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            totalContentHeight += child.height;
        }
        var currentGap = this.gap;
        if (!this.scrollable && this.children.length > 0) {
            if (this.justifyContent === 'start' || this.justifyContent === 'center' || this.justifyContent === 'end') {
                var availableSpace = height - this.padding.top - this.padding.bottom - totalContentHeight - this.gap * Math.max(0, this.children.length - 1);
                if (this.justifyContent === 'center') {
                    cy += availableSpace / 2;
                }
                else if (this.justifyContent === 'end') {
                    cy += availableSpace;
                }
            }
            else {
                var availableSpace = height - this.padding.top - this.padding.bottom - totalContentHeight;
                if (this.justifyContent === 'space-between') {
                    if (this.children.length > 1)
                        currentGap = availableSpace / (this.children.length - 1);
                    else
                        currentGap = 0;
                }
                else if (this.justifyContent === 'space-around') {
                    currentGap = availableSpace / this.children.length;
                    cy += currentGap / 2;
                }
                else if (this.justifyContent === 'space-evenly') {
                    currentGap = availableSpace / (this.children.length + 1);
                    cy += currentGap;
                }
            }
        }
        for (var _b = 0, _c = this.children; _b < _c.length; _b++) {
            var child = _c[_b];
            var cx = x + this.padding.left;
            var childWidth = cw;
            if (this.alignItems === 'center') {
                cx += (cw - child.width) / 2;
                childWidth = child.width;
            }
            else if (this.alignItems === 'end') {
                cx += cw - child.width;
                childWidth = child.width;
            }
            else if (this.alignItems === 'start') {
                childWidth = child.width;
            }
            child.layout(cx, cy, childWidth, child.height);
            cy += child.height + currentGap;
        }
    };
    Column.prototype.render = function (ctx, theme, dt, engine) {
        if (this.scrollable) {
            this.contentHeight = this.children.reduce(function (acc, child) { return acc + child.height + this.gap; }.bind(this), 0) - this.gap + this.padding.top + this.padding.bottom;
            if (this.contentHeight <= this.height) {
                this.scrollY = 0;
                this.stretchAmount = 0;
                this.velocityY = 0;
                this.isDragging = false;
            }
            else {
                var minScroll = Math.min(0, this.height - this.contentHeight);
                if (!this.isDragging) {
                    if (this.stretchAmount !== 0) {
                        this.stretchAmount += (0 - this.stretchAmount) * (1 - Math.exp(-25 * dt));
                        if (Math.abs(this.stretchAmount) < 0.5)
                            this.stretchAmount = 0;
                        engine.requestRender();
                    }
                    if (Math.abs(this.velocityY) > 0.1) {
                        this.scrollY += this.velocityY * dt;
                        // Increase friction from -2.5 to -5.0 to make it stop faster
                        this.velocityY *= Math.exp(-5.0 * dt);
                        if (this.scrollY > 0) {
                            this.stretchAmount += this.scrollY * 0.5; // Dampen the impact
                            if (this.stretchAmount > 100)
                                this.stretchAmount = 100 + (this.stretchAmount - 100) * 0.1; // Soft clamp
                            this.scrollY = 0;
                            this.velocityY = 0; // Kill velocity to prevent further extreme stretch
                        }
                        else if (this.scrollY < minScroll) {
                            this.stretchAmount += (this.scrollY - minScroll) * 0.5; // Dampen the impact
                            if (this.stretchAmount < -100)
                                this.stretchAmount = -100 + (this.stretchAmount + 100) * 0.1; // Soft clamp
                            this.scrollY = minScroll;
                            this.velocityY = 0; // Kill velocity to prevent further extreme stretch
                        }
                        engine.requestRender();
                    }
                    else {
                        this.velocityY = 0;
                    }
                }
            }
            // Update layout based on scrollY
            var cy = this.y + this.padding.top + this.scrollY;
            var cw = this.width - this.padding.left - this.padding.right;
            for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                var child = _a[_i];
                var cx = this.x + this.padding.left;
                var childWidth = cw;
                if (this.alignItems === 'center') {
                    cx += (cw - child.width) / 2;
                    childWidth = child.width;
                }
                else if (this.alignItems === 'end') {
                    cx += cw - child.width;
                    childWidth = child.width;
                }
                else if (this.alignItems === 'start') {
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
            var stretchY = 1;
            var originY = this.y;
            if (this.stretchAmount > 0) {
                stretchY = 1 + (this.stretchAmount / this.height) * 0.15;
                originY = this.y;
            }
            else if (this.stretchAmount < 0) {
                stretchY = 1 + (Math.abs(this.stretchAmount) / this.height) * 0.15;
                originY = this.y + this.height;
            }
            if (stretchY !== 1) {
                ctx.translate(0, originY);
                ctx.scale(1, stretchY);
                ctx.translate(0, -originY);
            }
        }
        for (var _b = 0, _c = this.children; _b < _c.length; _b++) {
            var child = _c[_b];
            if (this.scrollable) {
                if (child.y + child.height < this.y - 200 || child.y > this.y + this.height + 200)
                    continue;
            }
            child.render(ctx, theme, dt, engine);
        }
        if (this.scrollable) {
            ctx.restore();
        }
    };
    return Column;
}(UIComponent));
export { Column };
var Row = /** @class */ (function (_super) {
    __extends(Row, _super);
    function Row() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.gap = 0;
        _this.radius = 0;
        _this.justifyContent = 'start';
        _this.alignItems = 'center';
        return _this;
    }
    Row.prototype.measure = function (ctx, constraints) {
        var totalWidth = this.padding.left + this.padding.right;
        var maxHeight = 0;
        var flexTotal = 0;
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (child.flex)
                flexTotal += child.flex;
            else {
                var size = child.measure(ctx, { minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: constraints.maxHeight - this.padding.top - this.padding.bottom });
                child.width = size.width;
                child.height = size.height;
                totalWidth += size.width;
                maxHeight = Math.max(maxHeight, size.height);
            }
        }
        totalWidth += Math.max(0, this.children.length - 1) * this.gap;
        if (flexTotal > 0 && constraints.maxWidth !== Infinity) {
            var remaining = Math.max(0, constraints.maxWidth - totalWidth);
            for (var _b = 0, _c = this.children; _b < _c.length; _b++) {
                var child = _c[_b];
                if (child.flex) {
                    var w = (child.flex / flexTotal) * remaining;
                    var size = child.measure(ctx, { minWidth: w, maxWidth: w, minHeight: 0, maxHeight: constraints.maxHeight - this.padding.top - this.padding.bottom });
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
    };
    Row.prototype.layout = function (x, y, width, height) {
        _super.prototype.layout.call(this, x, y, width, height);
        var cx = x + this.padding.left;
        var ch = height - this.padding.top - this.padding.bottom;
        var totalContentWidth = 0;
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            totalContentWidth += child.width;
        }
        var currentGap = this.gap;
        if (this.children.length > 0) {
            if (this.justifyContent === 'start' || this.justifyContent === 'center' || this.justifyContent === 'end') {
                var availableSpace = width - this.padding.left - this.padding.right - totalContentWidth - this.gap * Math.max(0, this.children.length - 1);
                if (this.justifyContent === 'center') {
                    cx += availableSpace / 2;
                }
                else if (this.justifyContent === 'end') {
                    cx += availableSpace;
                }
            }
            else {
                var availableSpace = width - this.padding.left - this.padding.right - totalContentWidth;
                if (this.justifyContent === 'space-between') {
                    if (this.children.length > 1)
                        currentGap = availableSpace / (this.children.length - 1);
                    else
                        currentGap = 0;
                }
                else if (this.justifyContent === 'space-around') {
                    currentGap = availableSpace / this.children.length;
                    cx += currentGap / 2;
                }
                else if (this.justifyContent === 'space-evenly') {
                    currentGap = availableSpace / (this.children.length + 1);
                    cx += currentGap;
                }
            }
        }
        for (var _b = 0, _c = this.children; _b < _c.length; _b++) {
            var child = _c[_b];
            var cy = y + this.padding.top;
            var childHeight = ch;
            if (this.alignItems === 'center') {
                cy += (ch - child.height) / 2;
                childHeight = child.height;
            }
            else if (this.alignItems === 'end') {
                cy += ch - child.height;
                childHeight = child.height;
            }
            else if (this.alignItems === 'start') {
                childHeight = child.height;
            }
            child.layout(cx, cy, child.width, childHeight);
            cx += child.width + currentGap;
        }
    };
    Row.prototype.render = function (ctx, theme, dt, engine) {
        if (this.bg) {
            ctx.fillStyle = this.bg === 'surfaceVariant' ? theme.surfaceVariant : (this.bg === 'surface' ? theme.surface : this.bg);
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.width, this.height, this.radius);
            ctx.fill();
        }
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            child.render(ctx, theme, dt, engine);
        }
    };
    return Row;
}(UIComponent));
export { Row };
