import { FrameworkEngine } from './engine';
import { MemoryRouter } from './router';
import { setRenderRequest } from './reactivity';

export interface AppConfig {
  canvas: HTMLCanvasElement;
  router: MemoryRouter;
}

export class FrameworkApp {
  private engine: FrameworkEngine | null = null;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    var self = this;
    this.config.router.subscribe(function() { self.render(); });
    
    setRenderRequest(function() {
      if (self.engine) {
        self.engine.requestRender();
      }
    });
  }

  public start() {
    this.render();
  }

  private render() {
    try {
      var rootWidget = this.config.router.getCurrentWidget();

      if (!this.engine) {
        this.engine = new FrameworkEngine(
          this.config.canvas,
          rootWidget
        );
      } else {
        this.engine.lastError = null;
        this.engine.updateRoot(rootWidget);
      }
    } catch (e) {
      console.error("Framework App Error:", e);
      if (this.engine) {
        this.engine.lastError = e as Error;
        this.engine.requestRender();
      }
    }
  }
}
