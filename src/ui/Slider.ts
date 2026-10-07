import type { ParamSpec } from '../state/params';

/** A labelled range input that displays its current value. */
export class Slider {
  readonly element: HTMLLabelElement;
  private readonly spec: ParamSpec;
  private readonly input: HTMLInputElement;
  private readonly valueText: HTMLSpanElement;

  constructor(spec: ParamSpec, value: number, onInput: (value: number) => void) {
    this.spec = spec;

    const name = document.createElement('span');
    name.className = 'slider-name';
    name.textContent = spec.label;

    this.valueText = document.createElement('span');
    this.valueText.className = 'slider-value';

    this.input = document.createElement('input');
    this.input.type = 'range';
    this.input.min = String(toSliderPosition(spec, spec.min));
    this.input.max = String(toSliderPosition(spec, spec.max));
    this.input.step = spec.logarithmic ? 'any' : String(spec.step);
    this.input.addEventListener('input', () => {
      const newValue = fromSliderPosition(spec, this.input.valueAsNumber);
      this.showValue(newValue);
      onInput(newValue);
    });

    this.element = document.createElement('label');
    this.element.className = 'slider';
    this.element.append(name, this.valueText, this.input);
    this.setValue(value);
  }

  setValue(value: number): void {
    this.input.value = String(toSliderPosition(this.spec, value));
    this.showValue(value);
  }

  private showValue(value: number): void {
    this.valueText.textContent = value.toFixed(decimalsOf(this.spec.step));
  }
}

/** Logarithmic sliders move through ln(value), so each slider unit is the same zoom factor. */
export function toSliderPosition(spec: ParamSpec, value: number): number {
  return spec.logarithmic ? Math.log(value) : value;
}

export function fromSliderPosition(spec: ParamSpec, position: number): number {
  return spec.logarithmic ? Math.exp(position) : position;
}

function decimalsOf(step: number): number {
  return Math.max(0, Math.ceil(-Math.log10(step)));
}
