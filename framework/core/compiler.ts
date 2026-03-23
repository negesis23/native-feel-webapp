import { UIComponent } from './component';
import { Column, Row } from '../components/Layouts';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { IconButton } from '../components/IconButton';
import { TextField } from '../components/TextField';
import { Checkbox } from '../components/Checkbox';
import { Icon } from '../components/Icon';
import { Signal } from './reactivity';
export function xml() {
    var markup = '';
    var values = [];
    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        if (typeof arg === 'string') {
            markup += arg;
        } else {
            markup += '__VAL_' + values.length + '__';
            values.push(arg);
        }
    }
    return { markup: markup, values: values };
}
var Compiler = /** @class */ (function () {
    function Compiler() {
    }
    Compiler.registerComponent = function (name, component) {
        this.registry[name.toLowerCase()] = component;
    };
    Compiler.compile = function (template) {
        var markup = typeof template === 'string' ? template : template.markup;
        var values = typeof template === 'string' ? [] : template.values;
        var parser = new DOMParser();
        var doc = parser.parseFromString("<root>".concat(markup, "</root>"), "application/xml");
        var parserError = doc.querySelector('parsererror');
        if (parserError) {
            console.error("XML Parsing Error:", parserError.textContent);
            throw new Error("XML Parsing Error: ".concat(parserError.textContent));
        }
        var rootElement = doc.documentElement.firstElementChild;
        if (!rootElement) {
            throw new Error("Template parsing error: No root element found in template.");
        }
        return this.buildNode(rootElement, values);
    };
    Compiler.buildNode = function (node, values) {
        var tag = node.tagName.toLowerCase();
        // Custom Component
        if (this.registry[tag]) {
            var props = {};
            for (var i = 0; i < node.attributes.length; i++) {
                var attr = node.attributes[i];
                var val = attr.value;
                if (typeof val === 'string' && val.indexOf('__VAL_') === 0 && val.indexOf('__', val.length - 2) !== -1) {
                    var index = parseInt(val.substring(6, val.length - 2));
                    val = values[index];
                }
                props[attr.name] = val;
            }
            var children = [];
            for (var i = 0; i < node.children.length; i++) {
                children.push(this.buildNode(node.children[i], values));
            }
            if (children.length > 0)
                props.children = children;
            var result = this.registry[tag](props);
            if (result instanceof UIComponent) {
                return result;
            }
            return this.compile(result);
        }
        var comp;
        switch (tag) {
            case 'column':
                comp = new Column();
                break;
            case 'row':
                comp = new Row();
                break;
            case 'text':
                comp = new Text();
                break;
            case 'button':
                comp = new Button();
                break;
            case 'iconbutton':
                comp = new IconButton();
                break;
            case 'textfield':
                comp = new TextField();
                break;
            case 'checkbox':
                comp = new Checkbox();
                break;
            case 'icon':
                comp = new Icon();
                break;
            default:
                comp = new Column();
                break;
        }
        var applyProp = function (name, value) {
            var lowerName = name.toLowerCase();
            if (lowerName === 'id')
                comp.id = value;
            else if (lowerName === 'flex')
                comp.flex = typeof value === 'number' ? value : parseFloat(value);
            else if (lowerName === 'padding') {
                var p = typeof value === 'number' ? value : parseFloat(value);
                comp.padding = { top: p, right: p, bottom: p, left: p };
            }
            else if (lowerName === 'gap' && (comp instanceof Column || comp instanceof Row))
                comp.gap = typeof value === 'number' ? value : parseFloat(value);
            else if (lowerName === 'bg' && (comp instanceof Column || comp instanceof Row))
                comp.bg = value;
            else if (lowerName === 'radius' && (comp instanceof Column || comp instanceof Row))
                comp.radius = typeof value === 'number' ? value : parseFloat(value);
            else if (lowerName === 'scrollable' && comp instanceof Column)
                comp.scrollable = value === true || value === 'true';
            else if ((lowerName === 'justify' || lowerName === 'justify-content') && (comp instanceof Column || comp instanceof Row))
                comp.justifyContent = value;
            else if ((lowerName === 'align' || lowerName === 'align-items') && (comp instanceof Column || comp instanceof Row))
                comp.alignItems = value;
            else if (lowerName === 'text' && (comp instanceof Text || comp instanceof Button))
                comp.text = String(value);
            else if (lowerName === 'variant' && (comp instanceof Text || comp instanceof Button || comp instanceof IconButton))
                comp.variant = value;
            else if (lowerName === 'icon' && (comp instanceof Button || comp instanceof IconButton || comp instanceof Icon))
                comp.icon = value;
            else if (lowerName === 'placeholder' && comp instanceof TextField)
                comp.placeholder = value;
            else if (lowerName === 'multiline' && comp instanceof TextField)
                comp.multiline = value === true || value === 'true';
            else if (lowerName === 'checked' && comp instanceof Checkbox)
                comp.checked = value === true || value === 'true';
            else if (lowerName.indexOf('on-') === 0) {
                var event_1 = lowerName.substring(3);
                if (event_1 === 'click')
                    comp.onClick = value;
                else if (event_1 === 'change')
                    comp.onChange = value;
                else if (event_1 === 'submit')
                    comp.onSubmit = value;
            }
            else if (lowerName.indexOf('bind-') === 0) {
                var prop = lowerName.substring(5);
                comp[prop] = value;
                if (prop === 'value' && comp instanceof TextField)
                    comp.propValue = value;
            }
        };
        var _loop_1 = function (i) {
            var attr = node.attributes[i];
            var value = attr.value;
            if (typeof value === 'string' && value.indexOf('__VAL_') === 0 && value.indexOf('__', value.length - 2) !== -1) {
                var index = parseInt(value.substring(6, value.length - 2));
                value = values[index];
            }
            if (value instanceof Signal) {
                applyProp(attr.name, value.value);
                var unsub = value.subscribe(function (newVal) {
                    applyProp(attr.name, newVal);
                });
                comp.cleanups.push(unsub);
            }
            else {
                applyProp(attr.name, value);
            }
        };
        for (var i = 0; i < node.attributes.length; i++) {
            _loop_1(i);
        }
        for (var i = 0; i < node.children.length; i++) {
            comp.addChild(this.buildNode(node.children[i], values));
        }
        return comp;
    };
    Compiler.registry = {};
    return Compiler;
}());
export { Compiler };
