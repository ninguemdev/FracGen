import { PARAM_SPECS, type ParamKey, type Params } from '../state/params';
import { Select } from './Select';
import { Slider } from './Slider';

interface Control {
  readonly element: HTMLElement;
  setValue(value: number): void;
}

const GROUPS: { title: string; keys: ParamKey[] }[] = [
  { title: 'Fractal', keys: ['iterations', 'juliaX', 'juliaY', 'zoom', 'positionX', 'positionY'] },
  { title: 'Symmetry', keys: ['symmetrySides', 'symmetryMirror'] },
  { title: 'Warp', keys: ['warpStrength', 'warpFrequency', 'warpOctaves', 'warpRotation', 'warpSpeed'] },
  {
    title: 'Color',
    keys: ['palette', 'colorFrequency', 'colorPhase', 'colorCycle', 'saturation', 'brightness', 'contrast'],
  },
];

/** One control per parameter, grouped; changing a control writes straight into `params`. */
export class ControlsPanel {
  private readonly params: Params;
  private readonly controls: [ParamKey, Control][] = [];

  constructor(container: HTMLElement, params: Params) {
    this.params = params;
    for (const group of GROUPS) {
      container.append(this.createGroup(group.title, group.keys));
    }
  }

  /** Shows the current values again after `params` changed elsewhere (e.g. reset). */
  refresh(): void {
    for (const [key, control] of this.controls) control.setValue(this.params[key]);
  }

  private createGroup(title: string, keys: ParamKey[]): HTMLElement {
    const section = document.createElement('section');
    section.className = 'control-group';

    const heading = document.createElement('h2');
    heading.className = 'control-group-title';
    heading.textContent = title;
    section.append(heading);

    for (const key of keys) {
      const control = this.createControl(key);
      this.controls.push([key, control]);
      section.append(control.element);
    }
    return section;
  }

  private createControl(key: ParamKey): Control {
    const spec = PARAM_SPECS[key];
    const onInput = (value: number) => {
      this.params[key] = value;
    };
    return spec.options
      ? new Select(spec.label, spec.options, this.params[key], onInput)
      : new Slider(spec, this.params[key], onInput);
  }
}
