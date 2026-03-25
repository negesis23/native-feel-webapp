export declare class FrameworkEngine {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    root: any;
    lastError: Error | null;
    private pointerDownX;
    private pointerDownY;
    private hasDragged;
    private pressedComponent;
    private hoveredComponent;
    private longPressTimeout;
    private isDirty;
    constructor(canvas: HTMLCanvasElement, root: any);
    updateRoot(newRoot: any): void;
    handleResize(): void;
    requestRender(): void;
    private setupEvents;
    private renderError;
    private lastTime;
    private loop;
}
