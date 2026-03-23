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
var IconButton = /** @class */ (function (_super) {
    __extends(IconButton, _super);
    function IconButton() {
        var _this = _super.call(this) || this;
        _this.icon = '';
        _this.variant = 'standard';
        _this.onPointerDown = function (x, y) {
            this.ripples.push({
                x: x - this.x,
                y: y - this.y,
                radius: 0,
                targetRadius: 40,
                alpha: 0.12,
                state: 'growing'
            });
        }.bind(_this);
        _this.onPointerUp = function () {
            this.ripples.forEach(function (r) { return r.state = 'fading'; });
        }.bind(_this);
        return _this;
    }
    IconButton.prototype.measure = function (ctx, constraints) {
        return { width: 40, height: 40 };
    };
    IconButton.prototype.render = function (ctx, theme, dt, engine) {
        var bg = 'transparent';
        var fg = theme.onSurfaceVariant;
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
            case 'standard':
                // fg is already onSurfaceVariant
                break;
        }
        // Draw Background
        if (bg !== 'transparent') {
            ctx.fillStyle = bg;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, Math.min(this.width, this.height) / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        // Draw Border
        if (border !== 'transparent') {
            ctx.strokeStyle = border;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, Math.min(this.width, this.height) / 2 - 0.5, 0, Math.PI * 2);
            ctx.stroke();
        }
        // Draw Ripples
        if (this.ripples.length > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, Math.min(this.width, this.height) / 2, 0, Math.PI * 2);
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
        // Draw Icon
        ctx.fillStyle = fg;
        ctx.font = '24px "Material Symbols Outlined"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        var metrics = ctx.measureText(this.icon);
        var yOffset = (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
        ctx.fillText(this.icon, this.x + this.width / 2, this.y + this.height / 2 + yOffset);
        ctx.textAlign = 'left';
    };
    return IconButton;
}(UIComponent));
export { IconButton };
