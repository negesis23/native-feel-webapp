import { createSignal } from '../framework/index';

export const state = {
  isDarkMode: createSignal(true),
  seedColor: createSignal('#4285F4'),
  openColorPicker: () => {},
};
