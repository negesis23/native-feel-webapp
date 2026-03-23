var UIComponent = /** @class */ (function () {
    function UIComponent() {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.children = [];
        this.padding = { top: 0, right: 0, bottom: 0, left: 0 };
        this.isHovered = false;
        this.isFocused = false;
        this.isPressed = false;
        this.needsScrollIntoView = false;
        this.ripples = [];
        this.cleanups = [];
    }
    UIComponent.prototype.destroy = function () {
        for (var _i = 0, _a = this.cleanups; _i < _a.length; _i++) {
            var cleanup = _a[_i];
            cleanup();
        }
        this.cleanups = [];
        for (var _b = 0, _c = this.children; _b < _c.length; _b++) {
            var child = _c[_b];
            child.destroy();
        }
        if (this.onDestroy)
            this.onDestroy();
    };
    UIComponent.prototype.handleClick = function (x, y, engine) {
        if (this.onClick)
            this.onClick(x, y, engine);
    };
    UIComponent.prototype.addChild = function (child) {
        child.parent = this;
        this.children.push(child);
    };
    UIComponent.prototype.layout = function (x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    };
    UIComponent.prototype.hitTest = function (x, y) {
        if (x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height) {
            for (var i = this.children.length - 1; i >= 0; i--) {
                var hit = this.children[i].hitTest(x, y);
                if (hit)
                    return hit;
            }
            return this;
        }
        return null;
    };
    UIComponent.prototype.findById = function (id) {
        if (this.id === id)
            return this;
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            var found = child.findById(id);
            if (found)
                return found;
        }
        return null;
    };
    return UIComponent;
}());
export { UIComponent };
