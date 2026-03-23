import { CompiledTemplate } from './compiler';

export class MemoryRouter {
  private routes: Record<string, () => string | CompiledTemplate> = {};
  private currentPath: string = '/';
  private listeners: (() => void)[] = [];

  constructor(initialPath: string = '/') {
    this.currentPath = initialPath;
  }

  addRoute(path: string, templateBuilder: () => string | CompiledTemplate) {
    this.routes[path] = templateBuilder;
  }

  navigate(path: string) {
    if (this.routes[path]) {
      this.currentPath = path;
      this.notifyListeners();
    } else {
      console.warn(`Route not found: ${path}`);
    }
  }

  getCurrentTemplate(): string | CompiledTemplate {
    const builder = this.routes[this.currentPath];
    return builder ? builder() : '<column padding="24"><text text="404 Not Found" variant="headline" /></column>';
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
