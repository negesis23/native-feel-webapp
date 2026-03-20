export class CanvasEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number = 0;
  height: number = 0;
  dpr: number = 1;

  // Input state
  pointerX: number = 0;
  pointerY: number = 0;
  isPointerDown: boolean = false;
  justClicked: boolean = false;
  pointerDeltaY: number = 0;
  lastPointerY: number = 0;
  isDragging: boolean = false;
  dragThreshold: number = 5;
  downX: number = 0;
  downY: number = 0;

  // Animation state
  lastTime: number = 0;
  animationFrameId: number = 0;

  // Callbacks
  onDraw: (ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) => void = () => {};
  onClick: (x: number, y: number) => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;

    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);

    window.addEventListener('resize', this.resize);
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);

    this.resize();
  }

  start() {
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  stop() {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.resize);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
  }

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(this.dpr, this.dpr);
  }

  handlePointerDown(e: PointerEvent) {
    this.isPointerDown = true;
    this.pointerX = e.clientX;
    this.pointerY = e.clientY;
    this.lastPointerY = e.clientY;
    this.downX = e.clientX;
    this.downY = e.clientY;
    this.isDragging = false;
    this.pointerDeltaY = 0;
  }

  handlePointerMove(e: PointerEvent) {
    this.pointerX = e.clientX;
    this.pointerY = e.clientY;
    
    if (this.isPointerDown) {
      this.pointerDeltaY = this.pointerY - this.lastPointerY;
      this.lastPointerY = this.pointerY;
      
      if (!this.isDragging) {
        const dx = this.pointerX - this.downX;
        const dy = this.pointerY - this.downY;
        if (Math.sqrt(dx * dx + dy * dy) > this.dragThreshold) {
          this.isDragging = true;
        }
      }
    }
  }

  handlePointerUp(e: PointerEvent) {
    this.isPointerDown = false;
    if (!this.isDragging) {
      this.justClicked = true;
      this.onClick(this.pointerX, this.pointerY);
    }
  }

  loop(time: number) {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.onDraw(this.ctx, this.width, this.height, dt);

    // Reset per-frame state
    this.justClicked = false;
    this.pointerDeltaY = 0;

    this.animationFrameId = requestAnimationFrame(this.loop);
  }
}
