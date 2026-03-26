let globalRenderRequest: (() => void) | null = null;

export function setRenderRequest(fn: () => void) {
  globalRenderRequest = fn;
}

export function requestRender() {
  if (globalRenderRequest) {
    globalRenderRequest();
  }
}

type Listener<T> = (newValue: T) => void;

export class Signal<T> {
  private _value: T;
  private listeners: Set<Listener<T>> = new Set();

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  get value(): T {
    return this._value;
  }

  set value(newValue: T) {
    if (this._value !== newValue) {
      this._value = newValue;
      this.notify();
      requestRender(); // Automatically trigger re-repaint
    }
  }

  subscribe(listener: Listener<T>) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this._value);
    }
  }
}

export function createSignal<T>(initialValue: T): Signal<T> {
  return new Signal<T>(initialValue);
}
