import { xml, Compiler, createSignal } from '../../framework/index';
import { state } from '../state';
import { goAbout } from '../main';

// 1. Reusable Component with LOCAL STATE!
Compiler.registerComponent('counter', (props: any) => {
  // Setiap elemen <counter /> akan punya state ini sendiri-sendiri
  const count = createSignal(parseInt(props.initial || '0'));
  
  const increment = () => count.value++;
  const decrement = () => count.value--;

  return xml`
    <column bg="surfaceVariant" padding="16" radius="12" gap="12" align="center">
      <text text="${props.title}" variant="title" />
      <row gap="16" align="center">
        <button text="-" variant="tonal" on-click="${decrement}" />
        <text text="${count}" variant="headline" />
        <button text="+" variant="filled" on-click="${increment}" />
      </row>
    </column>
  `;
});

export const HomeScreen = () => {
  const toggleTheme = () => {
    state.isDarkMode.value = !state.isDarkMode.value;
  };

  // 2. Declarative UI (React Style)
  return xml`
    <column flex="1" bg="surface">
      <row padding="16" gap="16">
        <text text="Local State Demo" variant="title" flex="1" />
        <iconbutton icon="palette" variant="standard" on-click="${state.openColorPicker}" />
        <iconbutton icon="light_mode" variant="standard" on-click="${toggleTheme}" />
        <iconbutton icon="info" variant="standard" on-click="${goAbout}" />
      </row>
      
      <column padding="24" gap="16" flex="1" align="center" justify="center">
        <!-- Komponen ini masing-masing punya state mandiri yang tidak campur global! -->
        <counter title="Player 1 Score" initial="0" />
        <counter title="Player 2 Score" initial="10" />
      </column>
    </column>
  `;
};
