import { xml } from '../../framework/index';
import { state } from '../state';
import { goHome } from '../main';

export var AboutScreen = function () {
    var toggleTheme = function () {
        state.isDarkMode.value = !state.isDarkMode.value;
    };

    return xml(
        '<column flex="1" bg="surface">',
            '<row padding="16" gap="16">',
                '<iconbutton icon="arrow_back" variant="standard" on-click="', goHome, '" />',
                '<text text="About Architecture" variant="title" flex="1" />',
                '<iconbutton icon="light_mode" variant="standard" on-click="', toggleTheme, '" />',
            '</row>',
            
            '<column padding="24" gap="20">',
                '<text text="Clean Project Structure" variant="title" />',
                '<text text="• state.ts: Centralized state &amp; handlers." variant="body" />',
                '<text text="• screens/: Modular UI definitions." variant="body" />',
                '<text text="• router.ts: Declarative route mapping." variant="body" />',
                '<text text="• main.ts: Simple app bootstrapping." variant="body" />',
                '<button text="Back to Home" variant="tonal" on-click="', goHome, '" />',
            '</column>',
        '</column>'
    );
};
