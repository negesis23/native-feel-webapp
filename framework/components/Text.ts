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
var Text = /** @class */ (function (_super) {
    __extends(Text, _super);
    function Text() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.text = '';
        _this.variant = 'body';
        _this.lines = [];
        _this.lineHeight = 0;
        return _this;
    }
    Text.prototype.getFont = function () {
        switch (this.variant) {
            case 'display': return '400 36px "Google Sans", sans-serif';
            case 'headline': return '400 24px "Google Sans", sans-serif';
            case 'title': return '500 16px "Google Sans", sans-serif';
            case 'label': return '500 14px "Google Sans", sans-serif';
            case 'body':
            default: return '400 14px "Google Sans", sans-serif';
        }
    };
    Text.prototype.measure = function (ctx, constraints) {
        var _a;
        ctx.font = this.getFont();
        var words = this.text.split(' ');
        this.lines = [];
        var currentLine = '';
        var maxWidth = 0;
        for (var i = 0; i < words.length; i++) {
            var testLine = currentLine + words[i] + ' ';
            var metrics = ctx.measureText(testLine);
            if (metrics.width > constraints.maxWidth && i > 0) {
                this.lines.push(currentLine.trim());
                currentLine = words[i] + ' ';
            }
            else {
                currentLine = testLine;
                maxWidth = Math.max(maxWidth, metrics.width);
            }
        }
        this.lines.push(currentLine.trim());
        var fontSize = parseInt(((_a = this.getFont().match(/\d+px/)) === null || _a === void 0 ? void 0 : _a[0]) || '14');
        this.lineHeight = fontSize * 1.2;
        return {
            width: Math.max(constraints.minWidth || 0, Math.min(constraints.maxWidth, maxWidth)),
            height: Math.max(constraints.minHeight || 0, this.lines.length * this.lineHeight)
        };
    };
    Text.prototype.render = function (ctx, theme, dt, engine) {
        ctx.font = this.getFont();
        ctx.fillStyle = this.color || theme.onSurface;
        ctx.textBaseline = 'top';
        for (var i = 0; i < this.lines.length; i++) {
            ctx.fillText(this.lines[i], this.x, this.y + (i * this.lineHeight));
        }
    };
    return Text;
}(UIComponent));
export { Text };
