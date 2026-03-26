var NativeCanvas = (window as any).NativeCanvas;
import { appRouter } from './router';

var canvas = document.getElementById('app') as HTMLCanvasElement;
document.body.style.backgroundColor = '#1e1e1e';

var app = new NativeCanvas.NativeCanvasApp({
  canvas: canvas,
  router: appRouter
});

export function goHome() { appRouter.navigate('/'); }
export function goAbout() { appRouter.navigate('/about'); }
 
app.start();