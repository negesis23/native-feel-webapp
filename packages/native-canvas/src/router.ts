export function MemoryRouter(initialPath: string) {
  this.routes = {};
  this.currentPath = initialPath || '/';
  this.listeners = [];
}

MemoryRouter.prototype.addRoute = function(path: string, widgetBuilder: Function) {
  this.routes[path] = widgetBuilder;
};

MemoryRouter.prototype.navigate = function(path: string) {
  if (this.routes[path]) {
    this.currentPath = path;
    this.notifyListeners();
  } else {
    console.warn("Route not found: " + path);
  }
};

MemoryRouter.prototype.getCurrentWidget = function(): any {
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
};

MemoryRouter.prototype.subscribe = function(listener: any) {
  this.listeners.push(listener);
  var self = this;
  return function() {
    var idx = self.listeners.indexOf(listener);
    if (idx !== -1) self.listeners.splice(idx, 1);
  };
};

MemoryRouter.prototype.notifyListeners = function() {
  for (var i=0; i<this.listeners.length; i++) {
    this.listeners[i]();
  }
};
