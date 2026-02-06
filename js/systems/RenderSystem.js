class RenderSystem {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;
  }

  renderWorld(ctx, localPlayer, remotePlayers, essences, npcs, cameraX, cameraY) {
    // Clear canvas with semi-transparent overlay for motion blur effect
    ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!localPlayer) return;

    // Draw world grid (optional visual aid)
    this.drawGrid(ctx, cameraX, cameraY, this.canvas.width, this.canvas.height);

    // Draw essences (behind everything)
    essences.forEach((essence) => {
      if (essence.isInViewport(cameraX, cameraY, this.canvas.width, this.canvas.height)) {
        essence.render(ctx, cameraX, cameraY);
      }
    });

    // Draw NPCs
    npcs.forEach((npc) => {
      if (npc.isInViewport(cameraX, cameraY, this.canvas.width, this.canvas.height)) {
        npc.render(ctx, cameraX, cameraY);
      }
    });

    // Draw remote players
    remotePlayers.forEach((player) => {
      if (player.isInViewport(cameraX, cameraY, this.canvas.width, this.canvas.height)) {
        player.render(ctx, cameraX, cameraY);
      }
    });

    // Draw local player (on top)
    localPlayer.render(ctx, cameraX, cameraY);

    // Draw world boundaries
    this.drawWorldBoundaries(ctx, cameraX, cameraY);
  }

  drawGrid(ctx, cameraX, cameraY, width, height) {
    const gridSize = 100;
    const gridColor = 'rgba(0, 212, 255, 0.05)';

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    // Draw vertical lines
    const startX = Math.floor(cameraX / gridSize) * gridSize;
    for (let x = startX; x < cameraX + width; x += gridSize) {
      const screenX = x - cameraX;
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, height);
      ctx.stroke();
    }

    // Draw horizontal lines
    const startY = Math.floor(cameraY / gridSize) * gridSize;
    for (let y = startY; y < cameraY + height; y += gridSize) {
      const screenY = y - cameraY;
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(width, screenY);
      ctx.stroke();
    }
  }

  drawWorldBoundaries(ctx, cameraX, cameraY) {
    const worldSize = ClientConfig.WORLD_SIZE;
    const borderColor = 'rgba(255, 100, 100, 0.3)';
    const borderWidth = 2;

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.lineDashPattern = [10, 10];

    // Top
    ctx.beginPath();
    ctx.moveTo(0 - cameraX, 0 - cameraY);
    ctx.lineTo(worldSize.width - cameraX, 0 - cameraY);
    ctx.stroke();

    // Bottom
    ctx.beginPath();
    ctx.moveTo(0 - cameraX, worldSize.height - cameraY);
    ctx.lineTo(worldSize.width - cameraX, worldSize.height - cameraY);
    ctx.stroke();

    // Left
    ctx.beginPath();
    ctx.moveTo(0 - cameraX, 0 - cameraY);
    ctx.lineTo(0 - cameraX, worldSize.height - cameraY);
    ctx.stroke();

    // Right
    ctx.beginPath();
    ctx.moveTo(worldSize.width - cameraX, 0 - cameraY);
    ctx.lineTo(worldSize.width - cameraX, worldSize.height - cameraY);
    ctx.stroke();

    ctx.lineDashPattern = [];
  }

  drawPlayerCount(ctx, playerCount, x = 20, y = 60) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(`Players: ${playerCount}`, x, y);
  }
}
