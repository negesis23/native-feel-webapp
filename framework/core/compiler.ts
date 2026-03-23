import { UIComponent } from './component';
import { Column, Row } from '../components/Layouts';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { IconButton } from '../components/IconButton';
import { TextField } from '../components/TextField';
import { Checkbox } from '../components/Checkbox';
import { Icon } from '../components/Icon';
import { Signal } from './reactivity';

export interface CompiledTemplate {
  markup: string;
  values: any[];
}

export function xml(strings: TemplateStringsArray, ...values: any[]): CompiledTemplate {
  let markup = '';
  for (let i = 0; i < strings.length; i++) {
    markup += strings[i];
    if (i < values.length) {
      markup += `__VAL_${i}__`;
    }
  }
  return { markup, values };
}

export type FunctionalComponent = (props: any) => UIComponent | CompiledTemplate | string;

export class Compiler {
  private static registry: Record<string, FunctionalComponent> = {};

  static registerComponent(name: string, component: FunctionalComponent) {
    this.registry[name.toLowerCase()] = component;
  }

  static compile(template: CompiledTemplate | string): UIComponent {
    const markup = typeof template === 'string' ? template : template.markup;
    const values = typeof template === 'string' ? [] : template.values;

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<root>${markup}</root>`, "application/xml");
    
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error("XML Parsing Error:", parserError.textContent);
      throw new Error(`XML Parsing Error: ${parserError.textContent}`);
    }

    const rootElement = doc.documentElement.firstElementChild;
    if (!rootElement) {
        throw new Error("Template parsing error: No root element found in template.");
    }

    return this.buildNode(rootElement, values);
  }

  private static buildNode(node: Element, values: any[]): UIComponent {
    const tag = node.tagName.toLowerCase();

    // Custom Component
    if (this.registry[tag]) {
      const props: any = {};
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        let val: any = attr.value;
        if (typeof val === 'string' && val.startsWith('__VAL_') && val.endsWith('__')) {
            const index = parseInt(val.substring(6, val.length - 2));
            val = values[index];
        }
        props[attr.name] = val;
      }
      
      const children = [];
      for (let i = 0; i < node.children.length; i++) {
        children.push(this.buildNode(node.children[i], values));
      }
      if (children.length > 0) props.children = children;

      const result = this.registry[tag](props);
      if (result instanceof UIComponent) {
         return result;
      }
      return this.compile(result);
    }

    let comp: UIComponent;
    switch (tag) {
      case 'column': comp = new Column(); break;
      case 'row': comp = new Row(); break;
      case 'text': comp = new Text(); break;
      case 'button': comp = new Button(); break;
      case 'iconbutton': comp = new IconButton(); break;
      case 'textfield': comp = new TextField(); break;
      case 'checkbox': comp = new Checkbox(); break;
      case 'icon': comp = new Icon(); break;
      default: comp = new Column(); break;
    }

    const applyProp = (name: string, value: any) => {
      const lowerName = name.toLowerCase();
      if (lowerName === 'id') comp.id = value;
      else if (lowerName === 'flex') comp.flex = typeof value === 'number' ? value : parseFloat(value);
      else if (lowerName === 'padding') {
        const p = typeof value === 'number' ? value : parseFloat(value);
        comp.padding = { top: p, right: p, bottom: p, left: p };
      }
      else if (lowerName === 'gap' && (comp instanceof Column || comp instanceof Row)) (comp as any).gap = typeof value === 'number' ? value : parseFloat(value);
      else if (lowerName === 'bg' && (comp instanceof Column || comp instanceof Row)) (comp as any).bg = value;
      else if (lowerName === 'radius' && (comp instanceof Column || comp instanceof Row)) (comp as any).radius = typeof value === 'number' ? value : parseFloat(value);
      else if (lowerName === 'scrollable' && comp instanceof Column) comp.scrollable = value === true || value === 'true';
      else if ((lowerName === 'justify' || lowerName === 'justify-content') && (comp instanceof Column || comp instanceof Row)) (comp as any).justifyContent = value;
      else if ((lowerName === 'align' || lowerName === 'align-items') && (comp instanceof Column || comp instanceof Row)) (comp as any).alignItems = value;
      else if (lowerName === 'text' && (comp instanceof Text || comp instanceof Button)) (comp as any).text = String(value);
      else if (lowerName === 'variant' && (comp instanceof Text || comp instanceof Button || comp instanceof IconButton)) (comp as any).variant = value;
      else if (lowerName === 'icon' && (comp instanceof Button || comp instanceof IconButton || comp instanceof Icon)) (comp as any).icon = value;
      else if (lowerName === 'placeholder' && comp instanceof TextField) comp.placeholder = value;
      else if (lowerName === 'multiline' && comp instanceof TextField) comp.multiline = value === true || value === 'true';
      else if (lowerName === 'checked' && comp instanceof Checkbox) comp.checked = value === true || value === 'true';
      
      else if (lowerName.startsWith('on-')) {
        const event = lowerName.substring(3);
        if (event === 'click') comp.onClick = value;
        else if (event === 'change') (comp as any).onChange = value;
        else if (event === 'submit') (comp as any).onSubmit = value;
      }
      else if (lowerName.startsWith('bind-')) {
        const prop = lowerName.substring(5);
        (comp as any)[prop] = value;
        if (prop === 'value' && comp instanceof TextField) (comp as any).propValue = value;
      }
    };

    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      let value: any = attr.value;

      if (typeof value === 'string' && value.startsWith('__VAL_') && value.endsWith('__')) {
        const index = parseInt(value.substring(6, value.length - 2));
        value = values[index];
      }

      if (value instanceof Signal) {
        applyProp(attr.name, value.value);
        const unsub = value.subscribe((newVal) => {
          applyProp(attr.name, newVal);
        });
        comp.cleanups.push(unsub);
      } else {
        applyProp(attr.name, value);
      }
    }

    for (let i = 0; i < node.children.length; i++) {
      comp.addChild(this.buildNode(node.children[i], values));
    }

    return comp;
  }
}
