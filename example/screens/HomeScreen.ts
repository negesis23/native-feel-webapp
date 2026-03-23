var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { xml, Compiler, createSignal } from '../../framework/index';
import { state } from '../state';
import { goAbout } from '../main';
// 1. Reusable Component with LOCAL STATE!
Compiler.registerComponent('counter', function (props) {
    // Setiap elemen <counter /> akan punya state ini sendiri-sendiri
    var count = createSignal(parseInt(props.initial || '0'));
    var increment = function () { return count.value++; };
    var decrement = function () { return count.value--; };
    return xml(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    <column bg=\"surfaceVariant\" padding=\"16\" radius=\"12\" gap=\"12\" align=\"center\">\n      <text text=\"", "\" variant=\"title\" />\n      <row gap=\"16\" align=\"center\">\n        <button text=\"-\" variant=\"tonal\" on-click=\"", "\" />\n        <text text=\"", "\" variant=\"headline\" />\n        <button text=\"+\" variant=\"filled\" on-click=\"", "\" />\n      </row>\n    </column>\n  "], ["\n    <column bg=\"surfaceVariant\" padding=\"16\" radius=\"12\" gap=\"12\" align=\"center\">\n      <text text=\"", "\" variant=\"title\" />\n      <row gap=\"16\" align=\"center\">\n        <button text=\"-\" variant=\"tonal\" on-click=\"", "\" />\n        <text text=\"", "\" variant=\"headline\" />\n        <button text=\"+\" variant=\"filled\" on-click=\"", "\" />\n      </row>\n    </column>\n  "])), props.title, decrement, count, increment);
});
export var HomeScreen = function () {
    var toggleTheme = function () {
        state.isDarkMode.value = !state.isDarkMode.value;
    };
    // 2. Declarative UI (React Style)
    return xml(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n    <column flex=\"1\" bg=\"surface\">\n      <row padding=\"16\" gap=\"16\">\n        <text text=\"Local State Demo\" variant=\"title\" flex=\"1\" />\n        <iconbutton icon=\"palette\" variant=\"standard\" on-click=\"", "\" />\n        <iconbutton icon=\"light_mode\" variant=\"standard\" on-click=\"", "\" />\n        <iconbutton icon=\"info\" variant=\"standard\" on-click=\"", "\" />\n      </row>\n      \n      <column padding=\"24\" gap=\"16\" flex=\"1\" align=\"center\" justify=\"center\">\n        <!-- Komponen ini masing-masing punya state mandiri yang tidak campur global! -->\n        <counter title=\"Player 1 Score\" initial=\"0\" />\n        <counter title=\"Player 2 Score\" initial=\"10\" />\n      </column>\n    </column>\n  "], ["\n    <column flex=\"1\" bg=\"surface\">\n      <row padding=\"16\" gap=\"16\">\n        <text text=\"Local State Demo\" variant=\"title\" flex=\"1\" />\n        <iconbutton icon=\"palette\" variant=\"standard\" on-click=\"", "\" />\n        <iconbutton icon=\"light_mode\" variant=\"standard\" on-click=\"", "\" />\n        <iconbutton icon=\"info\" variant=\"standard\" on-click=\"", "\" />\n      </row>\n      \n      <column padding=\"24\" gap=\"16\" flex=\"1\" align=\"center\" justify=\"center\">\n        <!-- Komponen ini masing-masing punya state mandiri yang tidak campur global! -->\n        <counter title=\"Player 1 Score\" initial=\"0\" />\n        <counter title=\"Player 2 Score\" initial=\"10\" />\n      </column>\n    </column>\n  "])), state.openColorPicker, toggleTheme, goAbout);
};
var templateObject_1, templateObject_2;
