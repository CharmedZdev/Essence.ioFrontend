class Entity {
  constructor(id, x, y, radius = 5) {
    this.id = id;
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
    this.rotation = 0;
    this.radius = radius;
    this.type = 'entity';
  }

  update(deltaTime) {
    // Override in subclasses
  }

  render(ctx, cameraX, cameraY) {
    // Override in subclasses
  }

  distanceTo(other) {
    return this.position.distance(other.position);
  }

  isInViewport(cameraX, cameraY, viewportWidth, viewportHeight) {
    const padding = 100;
    return (
      this.position.x > cameraX - padding &&
      this.position.x < cameraX + viewportWidth + padding &&
      this.position.y > cameraY - padding &&
      this.position.y < cameraY + viewportHeight + padding
    );
  }
}
