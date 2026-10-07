import { PARAM_SPECS, type ParamKey, type Params } from '../state/params';
import { Slider } from './Slider';

const GROUPS: { title: string; keys: ParamKey[] }[] = [
  { title: 'Fractal', keys: ['iterations', 'juliaX', 'juliaY', 'zoom', 'positionX', 'positionY'] },
];

/** One slider per parameter, grouped; moving a slider writes straight into `params`. */
export class ControlsPanel {
  private readonly params: Params;
  private readonly sliders: [ParamKey, Slider][] = [];

  constructor(container: HTMLElement, params: Params) {
    this.params = params;
    for (const group of GROUPS) {
      container.append(this.createGroup(group.title, group.keys));
    }
  }

  /** Shows the current values again after `params` changed elsewhere (e.g. reset). */
  refresh(): void {
    for (const [key, slider] of this.sliders) slider.setValue(this.params[key]);
  }

  private createGroup(title: string, keys: ParamKey[]): HTMLElement {
    const section = document.createElement('section');
    section.className = 'control-group';

    const heading = document.createElement('h2');
    heading.className = 'control-group-title';
    heading.textContent = title;
    section.append(heading);

    for (const key of keys) {
      const slider = new Slider(PARAM_SPECS[key], this.params[key], (value) => {
        this.params[key] = value;
      });
      this.sliders.push([key, slider]);
      section.append(slider.element);
    }
    return section;
  }
}
