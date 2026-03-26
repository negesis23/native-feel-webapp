declare function FrameworkEngine(canvas: HTMLCanvasElement, root: any): void;

declare class MemoryRouter {
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

interface AppConfig {
    canvas: HTMLCanvasElement;
    router: MemoryRouter;
}
declare class NativeCanvasApp {
    private engine;
    private config;
    constructor(config: AppConfig);
    start(): void;
    private render;
}

declare function Widget(): void;
declare function Box(): any;
declare function TextWidget(textStr: any): void;
declare namespace TextWidget {
    var prototype: any;
}
declare function Text(textStr: any): any;
declare function Touchable(): any;

declare function setRenderRequest(fn: () => void): void;
declare function requestRender(): void;
type Listener<T> = (newValue: T) => void;
declare class Signal<T> {
    private _value;
    private listeners;
    constructor(initialValue: T);
    get value(): T;
    set value(newValue: T);
    subscribe(listener: Listener<T>): () => void;
    private notify;
}
declare function createSignal<T>(initialValue: T): Signal<T>;

export { type AppConfig, Box, FrameworkEngine, MemoryRouter, NativeCanvasApp, Signal, Text, TextWidget, Touchable, Widget, createSignal, requestRender, setRenderRequest };
