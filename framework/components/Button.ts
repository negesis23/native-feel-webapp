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
var Button = /** @class */ (function (_super) {
    __extends(Button, _super);
    function Button() {
        var _this = _super.call(this) || this;
        _this.text = '';
        _this.variant = 'filled';
        _this.onPointerDown = function (x, y) {
            this.ripples.push({
                x: x - this.x,
                y: y - this.y,
                radius: 0,
                targetRadius: Math.sqrt(this.width * this.width + this.height * this.height),
                alpha: 0.12,
                state: 'growing'
            });
        }.bind(_this);
        _this.onPointerUp = function () {
            this.ripples.forEach(function (r) { return r.state = 'fading'; });
        }.bind(_this);
        return _this;
    }
    Button.prototype.measure = function (ctx, constraints) {
        ctx.font = '500 14px "Google Sans", sans-serif';
        var metrics = ctx.measureText(this.text);
        var iconWidth = this.icon ? 24 + 8 : 0; // icon size + gap
        return { width: Math.max(64, metrics.width + iconWidth + 48), height: 40 };
    };
    Button.prototype.render = function (ctx, theme, dt, engine) {
        var bg = 'transparent';
        var fg = theme.primary;
        var border = 'transparent';
        switch (this.variant) {
            case 'filled':
                bg = theme.primary;
                fg = theme.onPrimary;
                break;
            case 'tonal':
                bg = theme.secondaryContainer;
                fg = theme.onSecondaryContainer;
                break;
            case 'outlined':
                border = theme.outline;
                break;
            case 'text':
                // fg is already primary
                break;
        }
        // Draw Background
        if (bg !== 'transparent') {
            ctx.fillStyle = bg;
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.width, this.height, 20);
            ctx.fill();
        }
        // Draw Border
        if (border !== 'transparent') {
            ctx.strokeStyle = border;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1, 20);
            ctx.stroke();
        }
        // Draw Ripples
        if (this.ripples.length > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.width, this.height, 20);
            ctx.clip();
            this.ripples.forEach(function (ripple) {
                if (ripple.state === 'growing') {
                    ripple.radius += (ripple.targetRadius - ripple.radius) * 10 * dt + 50 * dt;
                    if (ripple.radius > ripple.targetRadius)
                        ripple.radius = ripple.targetRadius;
                }
                else {
                    ripple.radius += (ripple.targetRadius - ripple.radius) * 15 * dt + 200 * dt;
                    ripple.alpha -= 0.5 * dt;
                }
                ctx.fillStyle = fg;
                ctx.globalAlpha = Math.max(0, ripple.alpha);
                ctx.beginPath();
                ctx.arc(this.x + ripple.x, this.y + ripple.y, ripple.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }.bind(this));
            ctx.restore();
            this.ripples = this.ripples.filter(function (r) { return r.alpha > 0; });
            if (this.ripples.length > 0)
                engine.requestRender();
        }
        // Draw Content
        ctx.fillStyle = fg;
        ctx.textBaseline = 'alphabetic';
        var startX = this.x + this.width / 2;
        if (this.icon) {
            ctx.font = '500 14px "Google Sans", sans-serif';
            var textWidth = ctx.measureText(this.text).width;
            var totalWidth = 18 + 8 + textWidth;
            startX = this.x + (this.width - totalWidth) / 2;
            ctx.font = '18px "Material Symbols Outlined"';
            ctx.textAlign = 'left';
            var iconMetrics = ctx.measureText(this.icon);
            var iconYOffset = (iconMetrics.actualBoundingBoxAscent - iconMetrics.actualBoundingBoxDescent) / 2;
            ctx.fillText(this.icon, startX, this.y + this.height / 2 + iconYOffset);
            startX += 18 + 8;
        }
        ctx.font = '500 14px "Google Sans", sans-serif';
        ctx.textAlign = this.icon ? 'left' : 'center';
        var textMetrics = ctx.measureText(this.text);
        var textYOffset = (textMetrics.actualBoundingBoxAscent - textMetrics.actualBoundingBoxDescent) / 2;
        ctx.fillText(this.text, startX, this.y + this.height / 2 + textYOffset);
        ctx.textAlign = 'left';
    };
    return Button;
}(UIComponent));
export { Button };
