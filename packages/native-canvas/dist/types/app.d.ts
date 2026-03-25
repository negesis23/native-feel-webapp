import { MemoryRouter } from './router';
export interface AppConfig {
    canvas: HTMLCanvasElement;
    router: MemoryRouter;
}
export declare class FrameworkApp {
    private engine;
    private config;
    constructor(config: AppConfig);
    start(): void;
    private render;
}
