export class MemoryRouter {
  private routes: Record<string, Function> = {};
  private currentPath: string = '/';
  private listeners: Array<() => void> = [];

  constructor(initialPath: string = '/') {
    this.currentPath = initialPath;
  }

  addRoute(path: string, widgetBuilder: Function) {
    this.routes[path] = widgetBuilder;
  }

  navigate(path: string) {
    if (this.routes[path]) {
      this.currentPath = path;
      this.notifyListeners();
    } else {
      console.warn("Route not found: " + path);
    }
  }

  getCurrentWidget(): any {
    var builder = this.routes[this.currentPath];
    if (builder) return builder();
    // Fallback widget if route not found
    return {
        destroy: function() {},
        measure: function() { return {w:0,h:0}; },
        layout: function() {},
        render: function() {},
        hitTest: function() { return null; }
    };
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    var self = this;
    return function() {
      var idx = self.listeners.indexOf(listener);
      if (idx !== -1) self.listeners.splice(idx, 1);
    };
  }

  private notifyListeners() {
    for (var i=0; i<this.listeners.length; i++) {
      this.listeners[i]();
    }
  }
}
