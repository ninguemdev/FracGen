/** A labelled dropdown whose value is the index of the chosen option. */
export class Select {
  readonly element: HTMLLabelElement;
  private readonly select: HTMLSelectElement;

  constructor(label: string, options: readonly string[], value: number, onInput: (value: number) => void) {
    const name = document.createElement('span');
    name.textContent = label;

    this.select = document.createElement('select');
    options.forEach((option, index) => this.select.add(new Option(option, String(index))));
    this.select.addEventListener('input', () => onInput(Number(this.select.value)));

    this.element = document.createElement('label');
    this.element.className = 'select';
    this.element.append(name, this.select);
    this.setValue(value);
  }

  setValue(value: number): void {
    this.select.value = String(value);
  }
}
