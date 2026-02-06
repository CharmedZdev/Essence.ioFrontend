class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.network = null;
    this.localPlayer = null;
    this.remotePlayers = new Map();
    this.essences = new Map();
    this.npcs = new Map();
    this.running = false;
    this.lastFrameTime = Date.now();
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = Date.now();
    this.gameStarted = false;
    this.playerName = '';
  }

  async initialize() {
    console.log('🎮 Initializing Essence.io...');
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.network = new NetworkClient(ClientConfig.SERVER_URL);
    
    try {
      await this.network.connect();
      console.log('✅ Connected to server');
      this.setupNetworkHandlers();
      this.showTitleScreen();
    } catch (error) {
      console.error('❌ Failed to connect to server:', error);
      this.showTitleScreenError('Failed to connect to server');
      return false;
    }

    return true;
  }

  setupNetworkHandlers() {
    this.network.on('init', (data) => {
      console.log('📦 Received init:', data);
      this.clientId = data.clientId;
    });

    this.network.on('worldSnapshot', (snapshot) => {
      console.log('🌍 Received world snapshot:', snapshot);
      
      if (!snapshot.players) {
        console.error('Invalid world snapshot - no players data');
        return;
      }

      snapshot.players.forEach(playerData => {
        if (playerData.id === snapshot.clientId) {
          this.localPlayer = new Player(
            playerData.id,
            playerData.name,
            playerData.position.x,
            playerData.position.y
          );
          this.localPlayer.essenceCount = playerData.essenceCount;
          this.localPlayer.health = playerData.health;
        }
      });

      snapshot.players.forEach(playerData => {
        if (playerData.id !== snapshot.clientId) {
          const remotePlayer = new RemotePlayer(
            playerData.id,
            playerData.name,
            playerData.position.x,
            playerData.position.y
          );
          remotePlayer.updateFromServer(playerData);
          this.remotePlayers.set(playerData.id, remotePlayer);
        }
      });

      if (snapshot.essences) {
        snapshot.essences.forEach(essenceData => {
          const essence = new Essence(
            essenceData.id,
            essenceData.position.x,
            essenceData.position.y,
            essenceData.type,
            essenceData.rarity,
            essenceData.level
          );
          this.essences.set(essenceData.id, essence);
        });
      }

      if (snapshot.npcs) {
        snapshot.npcs.forEach(npcData => {
          const npc = new NPC(
            npcData.id,
            npcData.position.x,
            npcData.position.y
          );
          this.npcs.set(npcData.id, npc);
        });
      }

      this.gameStarted = true;
      this.hideTitleScreen();
      this.startGame();
    });

    this.network.on('stateUpdate', (update) => {
      if (!update.updates) return;

      update.updates.forEach(entityUpdate => {
        if (entityUpdate.type === 'entityMoved') {
          const entity = this.getEntity(entityUpdate.entity.id);
          if (entity && entity !== this.localPlayer) {
            if (entity.updateFromServer) {
              entity.updateFromServer(entityUpdate.entity);
            } else {
              entity.position.set(entityUpdate.entity.position.x, entityUpdate.entity.position.y);
              entity.velocity.set(entityUpdate.entity.velocity.x, entityUpdate.entity.velocity.y);
              entity.rotation = entityUpdate.entity.rotation;
            }
          }
        }

        if (entityUpdate.type === 'essenceCollected') {
          this.essences.delete(entityUpdate.essenceId);
          const player = this.remotePlayers.get(entityUpdate.playerId) || this.localPlayer;
          if (player) {
            player.essenceCount = entityUpdate.essenceCount;
          }
        }
      });
    });

    this.network.on('playerJoined', (data) => {
      console.log('👤 Player joined:', data.playerData.name);
      const remotePlayer = new RemotePlayer(
        data.playerId,
        data.playerData.name,
        data.playerData.position.x,
        data.playerData.position.y
      );
      remotePlayer.updateFromServer(data.playerData);
      this.remotePlayers.set(data.playerId, remotePlayer);
    });

    this.network.on('playerLeft', (data) => {
      console.log('👤 Player left:', data.playerId);
      this.remotePlayers.delete(data.playerId);
    });

    this.network.on('pong', (data) => {
      this.network.handlePing(data);
    });
  }

  showTitleScreen() {
    const titleScreen = document.createElement('div');
    titleScreen.id = 'titleScreen';
    titleScreen.innerHTML = `
      <div class="title-container">
        <h1 class="game-title">ESSENCE.IO</h1>
        <p class="game-subtitle">Multiplayer IO Game</p>
        
        <div class="login-form">
          <input 
            type="text" 
            id="usernameInput" 
            class="username-input" 
            placeholder="Enter your name..." 
            maxlength="20"
          />
          <button id="playButton" class="play-button">PLAY</button>
        </div>
        
        <p class="connection-status">✓ Connected to server</p>
      </div>
    `;
    document.body.appendChild(titleScreen);

    const usernameInput = document.getElementById('usernameInput');
    const playButton = document.getElementById('playButton');

    const startGame = () => {
      const username = usernameInput.value.trim();
      if (username.length > 0) {
        this.playerName = username;
        this.joinGame(username);
        this.hideTitleScreen();
      } else {
        alert('Please enter a name');
      }
    };

    playButton.addEventListener('click', startGame);
    usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        startGame();
      }
    });

    usernameInput.focus();
  }

  hideTitleScreen() {
    const titleScreen = document.getElementById('titleScreen');
    if (titleScreen) {
      titleScreen.remove();
    }
  }

  showTitleScreenError(message) {
    const titleScreen = document.createElement('div');
    titleScreen.id = 'titleScreen';
    titleScreen.innerHTML = `
      <div class="title-container">
        <h1 class="game-title">ESSENCE.IO</h1>
        <p class="error-message">${message}</p>
        <button id="retryButton" class="play-button">Retry</button>
      </div>
    `;
    document.body.appendChild(titleScreen);

    document.getElementById('retryButton').addEventListener('click', () => {
      location.reload();
    });
  }

  joinGame(username) {
    this.network.send({
      type: 'join',
      data: {
        playerName: username
      }
    }, 'critical');
  }

  startGame() {
    this.inputSystem = new InputSystem();
    this.inputSystem.onInput = (keys) => {
      if (this.localPlayer) {
        this.localPlayer.setInputState(keys);
        this.network.send({
          type: 'input',
          input: {
            keys: keys,
            timestamp: Date.now()
          }
        });
      }
    };

    this.renderSystem = new RenderSystem(this.ctx, this.canvas);
    this.running = true;
    this.gameLoop();
  }

  getEntity(id) {
    if (this.localPlayer?.id === id) return this.localPlayer;
    return this.remotePlayers.get(id) || this.essences.get(id) || this.npcs.get(id);
  }

  gameLoop() {
    const now = Date.now();
    const deltaTime = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    if (this.localPlayer) {
      this.localPlayer.update(deltaTime);
    }

    this.remotePlayers.forEach(player => player.update(deltaTime));
    this.essences.forEach(essence => essence.update(deltaTime));
    this.npcs.forEach(npc => npc.update(deltaTime));

    this.network.processSendQueue();

    this.render();
    this.updateUI();

    this.frameCount++;
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    requestAnimationFrame(() => this.gameLoop());
  }

  render() {
    this.ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.localPlayer) return;

    const cameraX = this.localPlayer.position.x - this.canvas.width / 2;
    const cameraY = this.localPlayer.position.y - this.canvas.height / 2;

    this.renderSystem.renderWorld(
      this.ctx,
      this.localPlayer,
      this.remotePlayers,
      this.essences,
      this.npcs,
      cameraX,
      cameraY
    );
  }

  updateUI() {
    if (!this.localPlayer) return;

    document.getElementById('playerName').textContent = this.localPlayer.name;
    document.getElementById('essenceCount').textContent = `Essences: ${this.localPlayer.essenceCount}`;
    document.getElementById('health').textContent = `Health: ${this.localPlayer.health}/${this.localPlayer.maxHealth}`;
    document.getElementById('fps').textContent = `FPS: ${this.fps}`;
    document.getElementById('ping').textContent = `Ping: ${this.network.getPing()}ms`;
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const game = new Game();
  const initialized = await game.initialize();
  
  if (!initialized) {
    console.error('Failed to initialize game');
  }
});
