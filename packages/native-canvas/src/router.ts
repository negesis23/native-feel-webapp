export class MemoryRouter {
  private routes: Record<string, Function> = {};
  private currentPath: string = '/';
  private listeners: Set<() => void> = new Set();

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
      console.warn(`Route not found: ${path}`);
    }
  }

  getCurrentWidget(): any {
    const builder = this.routes[this.currentPath];
    if (builder) return builder();
    
    // Fallback widget if route not found
    return {
        destroy: () => {},
        measure: () => ({ w: 0, h: 0 }),
        layout: () => {},
        render: () => {},
        hitTest: () => null
    };
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
