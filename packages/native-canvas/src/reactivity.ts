var globalRenderRequest = null;
export function setRenderRequest(fn) {
    globalRenderRequest = fn;
}
export function requestRender() {
    if (globalRenderRequest) {
        globalRenderRequest();
    }
}
var Signal = /** @class */ (function () {
    function Signal(initialValue) {
        this.listeners = [];
        this._value = initialValue;
    }
    Object.defineProperty(Signal.prototype, "value", {
        get: function () {
            return this._value;
        },
        set: function (newValue) {
            if (this._value !== newValue) {
                this._value = newValue;
                this.notify();
                requestRender(); // Automatically trigger re-repaint
            }
        },
        enumerable: false,
        configurable: true
    });
    Signal.prototype.subscribe = function (listener) {
        this.listeners.push(listener);
        return function () {
            var idx = this.listeners.indexOf(listener);
            if (idx !== -1)
                this.listeners.splice(idx, 1);
        }.bind(this);
    };
    Signal.prototype.notify = function () {
        for (var _i = 0, _a = this.listeners; _i < _a.length; _i++) {
            var listener = _a[_i];
            listener(this._value);
        }
    };
    return Signal;
}());
export { Signal };
export function createSignal(initialValue) {
    return new Signal(initialValue);
}
