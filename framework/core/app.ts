import { FrameworkEngine } from './engine';
import { Compiler } from './compiler';
import { setRenderRequest } from './reactivity';
var FrameworkApp = /** @class */ (function () {
    function FrameworkApp(config) {
        this.engine = null;
        this.config = config;
        this.config.router.subscribe(function () { return this.render(); }.bind(this));
        // Bind reactivity system to engine render loop
        setRenderRequest(function () {
            if (this.engine) {
                this.engine.requestRender();
            }
        }.bind(this));
    }
    FrameworkApp.prototype.start = function () {
        this.render();
    };
    FrameworkApp.prototype.setTheme = function (isDarkMode, seedColor) {
        this.config.isDarkMode = isDarkMode;
        if (seedColor) {
            this.config.seedColor = seedColor;
        }
        if (this.engine) {
            this.engine.setTheme(this.config.seedColor || '#4285F4', this.config.isDarkMode);
        }
    };
    FrameworkApp.prototype.render = function () {
        try {
            var template = this.config.router.getCurrentTemplate();
            var root = Compiler.compile(template);
            if (!this.engine) {
                this.engine = new FrameworkEngine(this.config.canvas, root, this.config.seedColor || '#4285F4', this.config.isDarkMode !== undefined ? this.config.isDarkMode : true);
            }
            else {
                this.engine.lastError = null;
                this.engine.updateRoot(root);
            }
        }
        catch (e) {
            console.error("Framework App Error:", e);
            this.handleError(e);
        }
    };
    FrameworkApp.prototype.handleError = function (e) {
        if (!this.engine && this.config.canvas) {
            try {
                var fallbackRoot = Compiler.compile('<column />');
                this.engine = new FrameworkEngine(this.config.canvas, fallbackRoot);
            }
            catch (inner) {
                console.error("Critical Failure:", inner);
                return;
            }
        }
        if (this.engine) {
            this.engine.lastError = e;
            this.engine.requestRender();
        }
    };
    return FrameworkApp;
}());
export { FrameworkApp };
