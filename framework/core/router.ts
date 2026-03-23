var MemoryRouter = /** @class */ (function () {
    function MemoryRouter(initialPath) {
        if (initialPath === void 0) { initialPath = '/'; }
        this.routes = {};
        this.currentPath = '/';
        this.listeners = [];
        this.currentPath = initialPath;
    }
    MemoryRouter.prototype.addRoute = function (path, templateBuilder) {
        this.routes[path] = templateBuilder;
    };
    MemoryRouter.prototype.navigate = function (path) {
        if (this.routes[path]) {
            this.currentPath = path;
            this.notifyListeners();
        }
        else {
            console.warn("Route not found: ".concat(path));
        }
    };
    MemoryRouter.prototype.getCurrentTemplate = function () {
        var builder = this.routes[this.currentPath];
        return builder ? builder() : '<column padding="24"><text text="404 Not Found" variant="headline" /></column>';
    };
    MemoryRouter.prototype.subscribe = function (listener) {
        this.listeners.push(listener);
        return function () {
            this.listeners = this.listeners.filter(function (l) { return l !== listener; });
        }.bind(this);
    };
    MemoryRouter.prototype.notifyListeners = function () {
        for (var _i = 0, _a = this.listeners; _i < _a.length; _i++) {
            var listener = _a[_i];
            listener();
        }
    };
    return MemoryRouter;
}());
export { MemoryRouter };
