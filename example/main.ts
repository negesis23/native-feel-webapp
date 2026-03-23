import { FrameworkApp } from '../framework/index';
import { appRouter } from './router';
import { state } from './state';
var canvas = document.getElementById('app');
// Initialize App
var app = new FrameworkApp({
    canvas: canvas,
    router: appRouter,
    seedColor: state.seedColor.value,
    isDarkMode: state.isDarkMode.value,
});
// Sync Theme with Signal
state.isDarkMode.subscribe(function (dark) {
    app.setTheme(dark, state.seedColor.value);
});
state.seedColor.subscribe(function (color) {
    app.setTheme(state.isDarkMode.value, color);
});
// Setup Native Color Picker
var colorInput = document.createElement('input');
colorInput.type = 'color';
colorInput.value = state.seedColor.value;
colorInput.style.position = 'fixed';
colorInput.style.opacity = '0';
colorInput.style.pointerEvents = 'none';
document.body.appendChild(colorInput);
colorInput.addEventListener('input', function (e) {
    state.seedColor.value = e.target.value;
});
state.openColorPicker = function () {
    colorInput.click();
};
// Global Navigation
export var goHome = function () { return appRouter.navigate('/'); };
export var goAbout = function () { return appRouter.navigate('/about'); };
// Start the Application
app.start();
