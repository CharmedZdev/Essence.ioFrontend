class InputSystem {
  constructor() {
    this.keys = [];
    this.onInput = null;

    document.addEventListener('keydown', (e) => {
      if (!this.keys.includes(e.key)) {
        this.keys.push(e.key);
      }
      if (this.onInput) {
        this.onInput(this.keys);
      }
    });

    document.addEventListener('keyup', (e) => {
      const index = this.keys.indexOf(e.key);
      if (index > -1) {
        this.keys.splice(index, 1);
      }
      if (this.onInput) {
        this.onInput(this.keys);
      }
    });
  }

  getKeys() {
    return this.keys;
  }
}
