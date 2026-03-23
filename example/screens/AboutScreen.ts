var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { xml } from '../../framework/index';
import { state } from '../state';
import { goHome } from '../main';
export var AboutScreen = function () {
    var toggleTheme = function () {
        state.isDarkMode.value = !state.isDarkMode.value;
    };
    return xml(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    <column flex=\"1\" bg=\"surface\">\n      <row padding=\"16\" gap=\"16\">\n        <iconbutton icon=\"arrow_back\" variant=\"standard\" on-click=\"", "\" />\n        <text text=\"About Architecture\" variant=\"title\" flex=\"1\" />\n        <iconbutton icon=\"light_mode\" variant=\"standard\" on-click=\"", "\" />\n      </row>\n      <column padding=\"24\" gap=\"20\">\n        <text text=\"Clean Project Structure\" variant=\"title\" />\n        <text text=\"\u2022 state.ts: Centralized state &amp; handlers.\" variant=\"body\" />\n        <text text=\"\u2022 screens/: Modular UI definitions.\" variant=\"body\" />\n        <text text=\"\u2022 router.ts: Declarative route mapping.\" variant=\"body\" />\n        <text text=\"\u2022 main.ts: Simple app bootstrapping.\" variant=\"body\" />\n        <button text=\"Back to Home\" variant=\"tonal\" on-click=\"", "\" />\n      </column>\n    </column>\n  "], ["\n    <column flex=\"1\" bg=\"surface\">\n      <row padding=\"16\" gap=\"16\">\n        <iconbutton icon=\"arrow_back\" variant=\"standard\" on-click=\"", "\" />\n        <text text=\"About Architecture\" variant=\"title\" flex=\"1\" />\n        <iconbutton icon=\"light_mode\" variant=\"standard\" on-click=\"", "\" />\n      </row>\n      <column padding=\"24\" gap=\"20\">\n        <text text=\"Clean Project Structure\" variant=\"title\" />\n        <text text=\"\u2022 state.ts: Centralized state &amp; handlers.\" variant=\"body\" />\n        <text text=\"\u2022 screens/: Modular UI definitions.\" variant=\"body\" />\n        <text text=\"\u2022 router.ts: Declarative route mapping.\" variant=\"body\" />\n        <text text=\"\u2022 main.ts: Simple app bootstrapping.\" variant=\"body\" />\n        <button text=\"Back to Home\" variant=\"tonal\" on-click=\"", "\" />\n      </column>\n    </column>\n  "])), goHome, toggleTheme, goHome);
};
var templateObject_1;
