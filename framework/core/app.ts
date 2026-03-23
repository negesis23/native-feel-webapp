import { FrameworkEngine } from './engine';
import { Compiler, CompiledTemplate } from './compiler';
import { MemoryRouter } from './router';
import { setRenderRequest } from './reactivity';

export interface AppConfig {
  canvas: HTMLCanvasElement;
  router: MemoryRouter;
  seedColor?: string;
  isDarkMode?: boolean;
}

export class FrameworkApp {
  private engine: FrameworkEngine | null = null;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.config.router.subscribe(() => this.render());
    
    // Bind reactivity system to engine render loop
    setRenderRequest(() => {
      if (this.engine) {
        this.engine.requestRender();
      }
    });
  }

  public start() {
    this.render();
  }

  public setTheme(isDarkMode: boolean, seedColor?: string) {
    this.config.isDarkMode = isDarkMode;
    if (seedColor) {
      this.config.seedColor = seedColor;
    }
    if (this.engine) {
      this.engine.setTheme(this.config.seedColor || '#4285F4', this.config.isDarkMode);
    }
  }

  private render() {
    try {
      const template = this.config.router.getCurrentTemplate();
      const root = Compiler.compile(template);

      if (!this.engine) {
        this.engine = new FrameworkEngine(
          this.config.canvas,
          root,
          this.config.seedColor || '#4285F4',
          this.config.isDarkMode !== undefined ? this.config.isDarkMode : true
        );
      } else {
        this.engine.lastError = null;
        this.engine.updateRoot(root);
      }
    } catch (e) {
      console.error("Framework App Error:", e);
      this.handleError(e as Error);
    }
  }

  private handleError(e: Error) {
    if (!this.engine && this.config.canvas) {
      try {
        const fallbackRoot = Compiler.compile('<column />');
        this.engine = new FrameworkEngine(this.config.canvas, fallbackRoot);
      } catch (inner) {
        console.error("Critical Failure:", inner);
        return;
      }
    }
    
    if (this.engine) {
      this.engine.lastError = e;
      this.engine.requestRender();
    }
  }
}
