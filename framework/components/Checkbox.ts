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
var Checkbox = /** @class */ (function (_super) {
    __extends(Checkbox, _super);
    function Checkbox() {
        var _this = _super.call(this) || this;
        _this.checked = false;
        _this.onPointerDown = function (x, y) {
            this.ripples.push({
                x: x - this.x,
                y: y - this.y,
                radius: 0,
                targetRadius: 48,
                alpha: 0.12,
                state: 'growing'
            });
        }.bind(_this);
        _this.onPointerUp = function () {
            this.ripples.forEach(function (r) { return r.state = 'fading'; });
        }.bind(_this);
        return _this;
    }
    Checkbox.prototype.handleClick = function (x, y, engine) {
        this.checked = !this.checked;
        if (this.onChange)
            this.onChange(this.checked);
        _super.prototype.handleClick.call(this, x, y, engine);
    };
    Checkbox.prototype.measure = function (ctx, constraints) {
        return { width: 48, height: 48 };
    };
    Checkbox.prototype.render = function (ctx, theme, dt, engine) {
        var cx = this.x + 24;
        var cy = this.y + 24;
        var size = 18;
        // Draw Ripples
        if (this.ripples.length > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, 24, 0, Math.PI * 2);
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
                ctx.fillStyle = theme.onSurfaceVariant;
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
        if (this.checked) {
            ctx.fillStyle = theme.primary;
            ctx.beginPath();
            ctx.roundRect(cx - size / 2, cy - size / 2, size, size, 2);
            ctx.fill();
            ctx.strokeStyle = theme.onPrimary;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - 4, cy);
            ctx.lineTo(cx - 1, cy + 4);
            ctx.lineTo(cx + 5, cy - 4);
            ctx.stroke();
        }
        else {
            ctx.strokeStyle = theme.onSurfaceVariant;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cx - size / 2, cy - size / 2, size, size, 2);
            ctx.stroke();
        }
    };
    return Checkbox;
}(UIComponent));
export { Checkbox };
