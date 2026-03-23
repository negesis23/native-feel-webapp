import { createSignal } from '../framework/index';
export var state = {
    isDarkMode: createSignal(true),
    seedColor: createSignal('#4285F4'),
    openColorPicker: function () { },
};
