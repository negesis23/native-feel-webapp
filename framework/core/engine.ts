import { generateTheme } from './theme';
var FrameworkEngine = /** @class */ (function () {
    function FrameworkEngine(canvas, root, seedColor, isDark) {
        if (seedColor === void 0) { seedColor = '#6750A4'; }
        if (isDark === void 0) { isDark = true; }
        this.focusedComponent = null;
        this.pressedComponent = null;
        this.isDirty = true;
        this.lastTime = performance.now();
        this.isDestroyed = false;
        this.lastError = null;
        this.pointerDownX = 0;
        this.pointerDownY = 0;
        this.hasDragged = false;
        this.loop = function () {
            if (this.isDestroyed)
                return;
            var now = performance.now();
            var dt = (now - this.lastTime) / 1000;
            this.lastTime = now;
            try {
                if (this.lastError) {
                    this.renderError(this.lastError);
                }
                else if (this.isDirty) {
                    this.isDirty = false;
                    this.render(dt);
                }
            }
            catch (e) {
                this.lastError = e;
                console.error("Framework Render Error:", e);
            }
            requestAnimationFrame(this.loop);
        }.bind(this);
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.root = root;
        this.theme = generateTheme(seedColor, isDark);
        document.body.style.backgroundColor = this.theme.background;
        var setupInput = function (input) {
            input.style.position = 'fixed';
            input.style.opacity = '0';
            input.style.pointerEvents = 'none';
            input.style.top = '0px';
            input.style.left = '0px';
            input.style.width = '1px';
            input.style.height = '1px';
            input.style.padding = '0';
            input.style.margin = '0';
            input.style.display = 'none';
            input.style.zIndex = '-1';
            document.body.appendChild(input);
        };
        this.singleLineInput = document.createElement('input');
        this.singleLineInput.type = 'text';
        this.singleLineInput.enterKeyHint = 'go';
        setupInput(this.singleLineInput);
        this.multiLineInput = document.createElement('textarea');
        setupInput(this.multiLineInput);
        var setupListeners = function (input) {
            input.addEventListener('keydown', function (e) {
                var evt = e;
                if (this.focusedComponent && this.focusedComponent.isTextInput) {
                    var tf = this.focusedComponent;
                    if (evt.key === 'Enter' && !tf.multiline) {
                        evt.preventDefault();
                        if (tf.onSubmit)
                            tf.onSubmit(tf.value);
                        input.blur();
                    }
                }
            }.bind(this));
            input.addEventListener('input', function (e) {
                var _a;
                if (this.focusedComponent && this.focusedComponent.isTextInput) {
                    var tf = this.focusedComponent;
                    tf.value = input.value;
                    tf.reportedValues.add(input.value);
                    tf.cursorIndex = (_a = input.selectionStart) !== null && _a !== void 0 ? _a : tf.value.length;
                    tf.needsScrollIntoView = true;
                    if (tf.onChange) {
                        tf.onChange(tf.value);
                    }
                    this.requestRender();
                }
            }.bind(this));
            input.addEventListener('blur', function () {
                if (this.focusedComponent && this.focusedComponent.isTextInput) {
                    this.focusedComponent.isFocused = false;
                    this.focusedComponent = null;
                    input.style.display = 'none';
                    this.requestRender();
                }
            }.bind(this));
        }.bind(this);
        setupListeners(this.singleLineInput);
        setupListeners(this.multiLineInput);
        window.addEventListener('resize', function () { return this.handleResize(); }.bind(this));
        this.handleResize();
        document.addEventListener('selectionchange', function () {
            var _a;
            if ((document.activeElement === this.singleLineInput || document.activeElement === this.multiLineInput) && this.focusedComponent && this.focusedComponent.isTextInput) {
                var tf = this.focusedComponent;
                tf.cursorIndex = (_a = this.textInput.selectionStart) !== null && _a !== void 0 ? _a : 0;
                this.requestRender();
            }
        }.bind(this));
        this.setupEvents();
        this.loop();
    }
    Object.defineProperty(FrameworkEngine.prototype, "textInput", {
        get: function () {
            if (this.focusedComponent && this.focusedComponent.multiline) {
                return this.multiLineInput;
            }
            return this.singleLineInput;
        },
        enumerable: false,
        configurable: true
    });
    FrameworkEngine.prototype.updateRoot = function (newRoot) {
        // Preserve state for components with IDs
        var preserveState = function (oldNode, newNode) {
            if (oldNode.id && newNode.id === oldNode.id) {
                newNode.isFocused = oldNode.isFocused;
                newNode.isPressed = oldNode.isPressed;
                newNode.isHovered = oldNode.isHovered;
                newNode.ripples = oldNode.ripples;
                if (newNode.isFocused)
                    this.focusedComponent = newNode;
                if (newNode.isPressed)
                    this.pressedComponent = newNode;
            }
            // We don't have a full diffing algorithm, so we just match by ID globally
            // It's better to just find all nodes with IDs in the old tree and apply them to the new tree
        }.bind(this);
        var oldNodesWithIds = {};
        var collectIds = function (node) {
            if (node.id)
                oldNodesWithIds[node.id] = node;
            node.children.forEach(collectIds);
        };
        collectIds(this.root);
        this.focusedComponent = null;
        this.pressedComponent = null;
        var applyIds = function (node) {
            if (node.id && oldNodesWithIds.hasOwnProperty(node.id)) {
                var oldNode = oldNodesWithIds[node.id];
                node.isFocused = oldNode.isFocused;
                node.isPressed = oldNode.isPressed;
                node.isHovered = oldNode.isHovered;
                node.ripples = oldNode.ripples;
                if (node.scrollable && oldNode.scrollable) {
                    node.scrollY = oldNode.scrollY;
                    node.velocityY = oldNode.velocityY;
                }
                if (node.isTextInput && oldNode.isTextInput) {
                    node.cursorIndex = oldNode.cursorIndex;
                    node.selectionStart = oldNode.selectionStart;
                    node.selectionEnd = oldNode.selectionEnd;
                    node.showTooltip = oldNode.showTooltip;
                    node.scrollX = oldNode.scrollX;
                    node.scrollY = oldNode.scrollY;
                    node.reportedValues = oldNode.reportedValues;
                    if (node.propValue === oldNode.propValue) {
                        // Prop didn't change programmatically, preserve user's typed value
                        node.value = oldNode.value;
                    }
                    else if (node.reportedValues.has(node.propValue)) {
                        // Prop changed, but it's a stale echo of a value we recently reported!
                        // Ignore it and preserve user's typed value
                        node.value = oldNode.value;
                        // We can optionally remove older values from the set to prevent memory leaks
                        // but it's probably fine for short sessions.
                    }
                    else {
                        // Prop changed programmatically to a NEW value!
                        // Update hidden input if focused
                        node.reportedValues.clear();
                        if (this.focusedComponent === oldNode || this.focusedComponent === node) {
                            this.textInput.value = node.value;
                            this.textInput.setSelectionRange(node.cursorIndex, node.cursorIndex);
                        }
                    }
                }
                if (node.isFocused)
                    this.focusedComponent = node;
                if (node.isPressed)
                    this.pressedComponent = node;
            }
            node.children.forEach(applyIds);
        }.bind(this);
        applyIds(newRoot);
        if (this.root) {
            this.root.destroy();
        }
        this.root = newRoot;
        this.handleResize(); // Ensure new root fits current size
        this.requestRender();
    };
    FrameworkEngine.prototype.handleResize = function () {
        var _a;
        var dpr = window.devicePixelRatio || 1;
        // Gunakan getBoundingClientRect untuk mendapatkan ukuran asli elemen di DOM
        // Jangan gunakan window.innerWidth/Height karena bisa tidak sinkron dengan CSS saat toolbar browser muncul
        var rect = ((_a = this.canvas.parentElement) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect()) || this.canvas.getBoundingClientRect();
        // Pastikan ukuran CSS Canvas mengisi penuh container
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        var width = rect.width;
        var height = rect.height;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (this.focusedComponent) {
            this.focusedComponent.needsScrollIntoView = true;
        }
        this.requestRender();
    };
    FrameworkEngine.prototype.requestRender = function () {
        this.isDirty = true;
    };
    FrameworkEngine.prototype.setTheme = function (seedColor, isDark) {
        this.theme = generateTheme(seedColor, isDark);
        document.body.style.backgroundColor = this.theme.background;
        this.requestRender();
    };
    FrameworkEngine.prototype.setupEvents = function () {
        var getPointerCoords = function (e) {
            var rect = this.canvas.getBoundingClientRect();
            var dpr = window.devicePixelRatio || 1;
            // Normalisasi koordinat: jika CSS meleset dari buffer internal, ini akan menyesuaikan kembali
            var scaleX = this.canvas.width / rect.width / dpr;
            var scaleY = this.canvas.height / rect.height / dpr;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        }.bind(this);
        this.canvas.addEventListener('touchend', function (e) {
            if (this.focusedComponent && this.focusedComponent.isTextInput) {
                e.preventDefault();
                this.textInput.focus();
            }
        }.bind(this));
        this.canvas.addEventListener('mouseup', function (e) {
            if (this.focusedComponent && this.focusedComponent.isTextInput) {
                e.preventDefault();
                this.textInput.focus();
            }
        }.bind(this));
        this.canvas.addEventListener('pointerdown', function (e) {
            var _a = getPointerCoords(e), x = _a.x, y = _a.y;
            this.pointerDownX = x;
            this.pointerDownY = y;
            this.hasDragged = false;
            var hit = this.root.hitTest(x, y);
            if (this.focusedComponent && this.focusedComponent !== hit) {
                this.focusedComponent.isFocused = false;
                this.focusedComponent = null;
                this.singleLineInput.style.display = 'none';
                this.multiLineInput.style.display = 'none';
                this.singleLineInput.blur();
                this.multiLineInput.blur();
            }
            if (hit) {
                hit.isPressed = true;
                this.pressedComponent = hit;
                // Focus text input immediately on touch start for reliable mobile keyboard
                if (hit.isTextInput) {
                    e.preventDefault();
                    this.focusedComponent = hit;
                    hit.isFocused = true;
                    hit.needsScrollIntoView = true;
                    this.textInput.style.display = 'block';
                    if (this.textInput.value !== hit.value) {
                        this.textInput.value = hit.value || '';
                    }
                    this.textInput.focus();
                }
                var node = hit;
                while (node) {
                    if (node.onPointerDown)
                        node.onPointerDown(x, y, this);
                    node = node.parent;
                }
            }
            else {
                this.focusedComponent = null;
                this.singleLineInput.style.display = 'none';
                this.multiLineInput.style.display = 'none';
                this.singleLineInput.blur();
                this.multiLineInput.blur();
            }
            this.requestRender();
        }.bind(this));
        this.canvas.addEventListener('pointerup', function (e) {
            var _a = getPointerCoords(e), x = _a.x, y = _a.y;
            var hit = this.root.hitTest(x, y);
            if (this.pressedComponent) {
                this.pressedComponent.isPressed = false;
                var node = this.pressedComponent;
                while (node) {
                    if (node.onPointerUp)
                        node.onPointerUp(x, y, this);
                    node = node.parent;
                }
                // Only trigger click if released inside the pressed component and no drag occurred
                var isInside = x >= this.pressedComponent.x && x <= this.pressedComponent.x + this.pressedComponent.width &&
                    y >= this.pressedComponent.y && y <= this.pressedComponent.y + this.pressedComponent.height;
                if (isInside && !this.hasDragged) {
                    this.focusedComponent = this.pressedComponent;
                    this.pressedComponent.isFocused = true;
                    this.pressedComponent.handleClick(x, y, this);
                }
                this.pressedComponent = null;
            }
            this.requestRender();
        }.bind(this));
        this.canvas.addEventListener('pointermove', function (e) {
            var _a = getPointerCoords(e), x = _a.x, y = _a.y;
            if (this.pressedComponent) {
                if (Math.abs(x - this.pointerDownX) > 25 || Math.abs(y - this.pointerDownY) > 25) {
                    this.hasDragged = true;
                    this.pressedComponent.isPressed = false; // Cancel visual press state
                }
                var node = this.pressedComponent;
                while (node) {
                    if (node.onPointerMove)
                        node.onPointerMove(x, y, this);
                    node = node.parent;
                }
            }
        }.bind(this));
        window.addEventListener('keydown', function (e) {
            if (this.focusedComponent && this.focusedComponent.onKeyDown) {
                this.focusedComponent.onKeyDown(e);
                this.requestRender();
            }
        }.bind(this));
    };
    FrameworkEngine.prototype.renderError = function (err) {
        var ctx = this.ctx;
        var canvas = this.canvas;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#1A1C1E';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFB4AB';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('Framework Exception', 20, 40);
        // Tampilkan Pesan Error Utama (Bold)
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#FFB4AB';
        var message = "Error: ".concat(err.message);
        var currentY = 75;
        var maxWidth = canvas.width - 40;
        var lineHeight = 18;
        var wrapAndDraw = function (text, isStack) {
            var currentLine = '';
            for (var _i = 0, text_1 = text; _i < text_1.length; _i++) {
                var char = text_1[_i];
                var testLine = currentLine + char;
                if (ctx.measureText(testLine).width > maxWidth) {
                    ctx.fillText(currentLine, 20, currentY);
                    currentY += lineHeight;
                    currentLine = char;
                }
                else {
                    currentLine = testLine;
                }
                if (currentY > canvas.height - 20)
                    break;
            }
            ctx.fillText(currentLine, 20, currentY);
            currentY += lineHeight;
        };
        wrapAndDraw(message, false);
        // Tampilkan Stacktrace (Dimmed)
        ctx.font = '12px monospace';
        ctx.fillStyle = '#E2E2E6';
        currentY += 10; // Spasi tambahan antara pesan dan stack
        if (err.stack) {
            var stackLines = err.stack.split('\n');
            // Lewati baris pertama jika itu sama dengan pesan error
            var startIdx = stackLines[0].indexOf(err.message) !== -1 ? 1 : 0;
            for (var i = startIdx; i < stackLines.length; i++) {
                wrapAndDraw(stackLines[i].replace(/\t/g, '  '), true);
                if (currentY > canvas.height - 20)
                    break;
            }
        }
    };
    FrameworkEngine.prototype.ensureVisible = function (component) {
        var adjusted = false;
        var node = component;
        // Find scrollable parent
        while (node && node.parent) {
            var parentNode = node.parent;
            if (parentNode.scrollable) {
                var col = parentNode;
                // Check if component is out of view
                var topOverflow = parentNode.y - component.y;
                var bottomOverflow = (component.y + component.height) - (parentNode.y + parentNode.height);
                var oldScrollY = col.scrollY;
                if (bottomOverflow > 0) {
                    col.scrollY -= bottomOverflow + 20;
                }
                else if (topOverflow > 0) {
                    col.scrollY += topOverflow + 20;
                }
                var minScroll = Math.min(0, col.height - col.contentHeight);
                if (col.scrollY < minScroll)
                    col.scrollY = minScroll;
                if (col.scrollY > 0)
                    col.scrollY = 0;
                if (col.scrollY !== oldScrollY) {
                    adjusted = true;
                }
                break; // Only adjust the immediate scrollable parent
            }
            node = parentNode;
        }
        return adjusted;
    };
    FrameworkEngine.prototype.render = function (dt) {
        var dpr = window.devicePixelRatio || 1;
        var width = this.canvas.width / dpr;
        var height = this.canvas.height / dpr;
        this.ctx.fillStyle = this.theme.background;
        this.ctx.fillRect(0, 0, width, height);
        this.root.measure(this.ctx, { minWidth: width, maxWidth: width, minHeight: height, maxHeight: height });
        this.root.layout(0, 0, width, height);
        if (this.focusedComponent && this.focusedComponent.needsScrollIntoView) {
            if (this.ensureVisible(this.focusedComponent)) {
                this.root.layout(0, 0, width, height);
            }
            this.focusedComponent.needsScrollIntoView = false;
        }
        this.ctx.save();
        // Pass engine reference so components can request render during animations
        this.root.render(this.ctx, this.theme, dt, this);
        this.ctx.restore();
    };
    FrameworkEngine.prototype.destroy = function () {
        this.isDestroyed = true;
        if (this.singleLineInput && this.singleLineInput.parentNode) {
            this.singleLineInput.parentNode.removeChild(this.singleLineInput);
        }
        if (this.multiLineInput && this.multiLineInput.parentNode) {
            this.multiLineInput.parentNode.removeChild(this.multiLineInput);
        }
    };
    return FrameworkEngine;
}());
export { FrameworkEngine };
