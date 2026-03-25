export declare class MemoryRouter {
    private routes;
    private currentPath;
    private listeners;
    constructor(initialPath?: string);
    addRoute(path: string, widgetBuilder: Function): void;
    navigate(path: string): void;
    getCurrentWidget(): any;
    subscribe(listener: () => void): () => void;
    private notifyListeners;
}
