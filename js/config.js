const SERVER_URL = (() => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'ws://localhost:3001';
  }
  return 'wss://essence-io-server.onrender.com';
})();

const ClientConfig = {
  SERVER_URL: SERVER_URL,
  SEND_RATE: 60,
  INTERPOLATION_BUFFER_SIZE: 2,

  WORLD_SIZE: {
    width: 2000,
    height: 2000
  },
  VIEWPORT_PADDING: 200,

  ESSENCE_COLORS: {
    fire: '#ff4444',
    water: '#4488ff',
    earth: '#88aa44',
    air: '#aaaaff',
    void: '#222222',
    light: '#ffff88',
    dark: '#6644aa'
  },

  ESSENCE_RARITY_COLORS: {
    common: '#ffffff',
    uncommon: '#00ff00',
    rare: '#0088ff',
    epic: '#ff00ff',
    legendary: '#ffaa00'
  }
};
