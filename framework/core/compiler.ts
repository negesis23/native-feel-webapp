import { UIComponent } from './component';
import { Column, Row } from '../components/Layouts';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { IconButton } from '../components/IconButton';
import { TextField } from '../components/TextField';
import { Checkbox } from '../components/Checkbox';
import { Icon } from '../components/Icon';

export class Compiler {
  static compile(markup: string, context: Record<string, any>): UIComponent {
    const parser = new DOMParser();
    const doc = parser.parseFromString(markup, "text/xml");
    if (doc.querySelector('parsererror')) {
      console.error("Markup parsing error:", doc.querySelector('parsererror')?.textContent);
      return new Column();
    }
    return this.buildNode(doc.documentElement, context);
  }

  private static buildNode(node: Element, context: Record<string, any>): UIComponent {
    let comp: UIComponent;
    const tag = node.tagName;

    switch (tag) {
      case 'Column': comp = new Column(); break;
      case 'Row': comp = new Row(); break;
      case 'Text': comp = new Text(); break;
      case 'Button': comp = new Button(); break;
      case 'IconButton': comp = new IconButton(); break;
      case 'TextField': comp = new TextField(); break;
      case 'Checkbox': comp = new Checkbox(); break;
      case 'Icon': comp = new Icon(); break;
      default: comp = new Column(); break;
    }

    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      const name = attr.name;
      const value = attr.value;

      if (name === 'id') comp.id = value;
      else if (name === 'flex') comp.flex = parseFloat(value);
      else if (name === 'padding') {
        const p = parseFloat(value);
        comp.padding = { top: p, right: p, bottom: p, left: p };
      }
      else if (name === 'gap' && (comp instanceof Column || comp instanceof Row)) (comp as any).gap = parseFloat(value);
      else if (name === 'bg' && (comp instanceof Column || comp instanceof Row)) (comp as any).bg = value;
      else if (name === 'radius' && (comp instanceof Column || comp instanceof Row)) (comp as any).radius = parseFloat(value);
      else if (name === 'scrollable' && comp instanceof Column) comp.scrollable = value === 'true';
      else if ((name === 'justify-content' || name === 'justify') && (comp instanceof Column || comp instanceof Row)) (comp as any).justifyContent = value;
      else if ((name === 'align-items' || name === 'align') && (comp instanceof Column || comp instanceof Row)) (comp as any).alignItems = value;
      else if (name === 'text' && comp instanceof Text) comp.text = value;
      else if (name === 'text' && comp instanceof Button) comp.text = value;
      else if (name === 'variant' && comp instanceof Text) comp.variant = value as any;
      else if (name === 'variant' && comp instanceof Button) comp.variant = value as any;
      else if (name === 'variant' && comp instanceof IconButton) comp.variant = value as any;
      else if (name === 'icon' && comp instanceof Button) comp.icon = value;
      else if (name === 'icon' && comp instanceof IconButton) comp.icon = value;
      else if (name === 'placeholder' && comp instanceof TextField) comp.placeholder = value;
      else if (name === 'multiline' && comp instanceof TextField) comp.multiline = value === 'true';
      else if (name === 'icon' && comp instanceof Icon) comp.icon = value;
      else if (name === 'checked' && comp instanceof Checkbox) comp.checked = value === 'true';
      
      else if (name.startsWith('bind-')) {
        const prop = name.split('-')[1];
        (comp as any)[prop] = context[value];
        if (prop === 'value' && comp instanceof TextField) {
          (comp as any).propValue = context[value];
        }
      }
      else if (name.startsWith('on-')) {
        const event = name.split('-')[1];
        if (event === 'click') comp.onClick = context[value];
        if (event === 'change') (comp as any).onChange = context[value];
        if (event === 'submit') (comp as any).onSubmit = context[value];
      }
    }

    for (let i = 0; i < node.children.length; i++) {
      comp.addChild(this.buildNode(node.children[i], context));
    }

    return comp;
  }
}
