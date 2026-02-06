class NetworkClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.ws = null;
    this.clientId = null;
    this.connected = false;
    this.lastPingTime = 0;
    this.ping = 0;
    this.messageHandlers = new Map();
    this.sendQueue = [];
    this.lastSendTime = 0;
    this.sendInterval = 1000 / 60;
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          console.log('[NETWORK] Connected to server');
          this.connected = true;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onclose = () => {
          console.log('[NETWORK] Disconnected from server');
          this.connected = false;
        };

        this.ws.onerror = (error) => {
          console.error('[NETWORK ERROR]', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  handleMessage(packet) {
    if (packet.type === 'batch') {
      packet.messages.forEach(msg => this.processMessage(msg));
    } else {
      this.processMessage(packet);
    }
  }

  processMessage(message) {
    const type = message.type || message.data?.type;
    const handler = this.messageHandlers.get(type);

    if (handler) {
      handler(message.data || message);
    } else if (type !== 'batch') {
      console.warn(`[NETWORK] No handler for message type: ${type}`);
    }
  }

  on(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
  }

  send(message, priority = 'normal') {
    if (!this.connected) return;

    const packet = {
      type: message.type,
      data: message,
      timestamp: Date.now(),
      priority
    };

    this.sendQueue.push(packet);
  }

  processSendQueue() {
    const now = Date.now();

    if (now - this.lastSendTime < this.sendInterval) {
      return;
    }

    this.sendQueue.forEach(packet => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(packet));
      }
    });

    this.sendQueue = [];
    this.lastSendTime = now;
  }

  startHeartbeat() {
    setInterval(() => {
      if (this.connected) {
        this.send({ type: 'ping', timestamp: Date.now() }, 'critical');
      }
    }, 10000);
  }

  handlePing(data) {
    this.ping = Date.now() - data.serverTime;
  }

  getPing() {
    return this.ping;
  }

  isConnected() {
    return this.connected;
  }
}
