class Essence extends Entity {
  constructor(id, x, y, type, rarity, level) {
    const rarityRadii = { common: 3, uncommon: 4, rare: 5, epic: 6, legendary: 8 };
    super(id, x, y, rarityRadii[rarity] || 3);
    
    this.type = type;
    this.rarity = rarity;
    this.level = level;
    this.glowIntensity = 0;
    this.rotationSpeed = Math.random() * 2 - 1;
    this.bobOffset = 0;
    this.bobSpeed = 2 + Math.random() * 2;
  }

  update(deltaTime) {
    this.bobOffset += this.bobSpeed * deltaTime;
    this.velocity.multiply(0.98);
  }

  render(ctx, cameraX, cameraY) {
    const screenX = this.position.x - cameraX;
    const screenY = this.position.y - cameraY + Math.sin(this.bobOffset) * 3;

    const elementColor = ClientConfig.ESSENCE_COLORS[this.type];
    const rarityColor = ClientConfig.ESSENCE_RARITY_COLORS[this.rarity];

    const glowSize = this.radius + 5;
    const gradient = ctx.createRadialGradient(screenX, screenY, this.radius, screenX, screenY, glowSize);
    gradient.addColorStop(0, elementColor + 'aa');
    gradient.addColorStop(1, elementColor + '00');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = elementColor;
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = rarityColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}
