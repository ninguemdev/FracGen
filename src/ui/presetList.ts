import type { Preset } from '../state/presets';

/** A titled grid with a button per preset; clicking one hands it to `onSelect`. */
export function createPresetList(
  presets: readonly Preset[],
  onSelect: (preset: Preset) => void,
): HTMLElement {
  const heading = document.createElement('h2');
  heading.className = 'control-group-title';
  heading.textContent = 'Presets';

  const header = document.createElement('header');
  header.className = 'control-group-header';
  header.append(heading);

  const list = document.createElement('div');
  list.className = 'preset-list';
  for (const preset of presets) {
    const button = document.createElement('button');
    button.className = 'preset-button';
    button.type = 'button';
    button.textContent = preset.name;
    button.addEventListener('click', () => onSelect(preset));
    list.append(button);
  }

  const section = document.createElement('section');
  section.className = 'presets';
  section.append(header, list);
  return section;
}
