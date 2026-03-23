import { FrameworkApp } from '../framework/index';
import { appRouter } from './router';
import { state } from './state';

const canvas = document.getElementById('app') as HTMLCanvasElement;

// Initialize App
const app = new FrameworkApp({
  canvas,
  router: appRouter,
  seedColor: state.seedColor.value,
  isDarkMode: state.isDarkMode.value,
});

// Sync Theme with Signal
state.isDarkMode.subscribe((dark) => {
  app.setTheme(dark, state.seedColor.value);
});

state.seedColor.subscribe((color) => {
  app.setTheme(state.isDarkMode.value, color);
});

// Setup Native Color Picker
const colorInput = document.createElement('input');
colorInput.type = 'color';
colorInput.value = state.seedColor.value;
colorInput.style.position = 'fixed';
colorInput.style.opacity = '0';
colorInput.style.pointerEvents = 'none';
document.body.appendChild(colorInput);

colorInput.addEventListener('input', (e) => {
  state.seedColor.value = (e.target as HTMLInputElement).value;
});

state.openColorPicker = () => {
  colorInput.click();
};

// Global Navigation
export const goHome = () => appRouter.navigate('/');
export const goAbout = () => appRouter.navigate('/about');

// Start the Application
app.start();
