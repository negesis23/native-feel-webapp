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
var Icon = /** @class */ (function (_super) {
    __extends(Icon, _super);
    function Icon() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.icon = '';
        return _this;
    }
    Icon.prototype.measure = function (ctx, constraints) {
        return { width: 24, height: 24 };
    };
    Icon.prototype.render = function (ctx, theme, dt, engine) {
        ctx.font = '24px "Material Symbols Outlined"';
        ctx.fillStyle = this.color || theme.onSurface;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        var metrics = ctx.measureText(this.icon);
        var yOffset = (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
        ctx.fillText(this.icon, this.x + 12, this.y + 12 + yOffset);
        ctx.textAlign = 'left';
    };
    return Icon;
}(UIComponent));
export { Icon };
