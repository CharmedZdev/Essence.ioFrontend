class NPC extends Entity {
  constructor(id, x, y) {
    super(id, x, y, 6);
    this.type = 'npc';
    this.health = 10;
    this.maxHealth = 10;
  }

  update(deltaTime) {
    this.velocity.multiply(0.98);
  }

  render(ctx, cameraX, cameraY) {
    const screenX = this.position.x - cameraX;
    const screenY = this.position.y - cameraY;

    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = '#a0ff6f';
    ctx.fillRect(screenX - this.radius, screenY - this.radius - 10, this.radius * 2 * healthPercent, 4);
  }
}
