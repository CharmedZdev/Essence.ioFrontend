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
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[NETWORK] Connecting to ${this.serverUrl}`);
        this.ws = new WebSocket(this.serverUrl);

        const connectionTimeout = setTimeout(() => {
          if (this.ws.readyState !== WebSocket.OPEN) {
            console.error('[NETWORK] Connection timeout');
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('[NETWORK] Connected to server');
          this.connected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onclose = () => {
          clearTimeout(connectionTimeout);
          console.log('[NETWORK] Disconnected from server');
          this.connected = false;
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('[NETWORK ERROR]', error);
          reject(error);
        };
      } catch (error) {
        console.error('[NETWORK] Connection failed:', error);
        reject(error);
      }
    });
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      console.log(`[NETWORK] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(err => {
          console.error('[NETWORK] Reconnect failed:', err);
        });
      }, delay);
    }
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
    
    // **IMPORTANT: Handle server ping messages**
    if (type === 'ping') {
      console.log('[NETWORK] Received ping from server, sending pong');
      this.send({
        type: 'pong',
        timestamp: message.timestamp || Date.now(),
        serverTime: Date.now()
      });
      return; // Don't look for a handler, we handled it
    }

    const handler = this.messageHandlers.get(type);

    if (handler) {
      handler(message.data || message);
    }
  }

  on(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
  }

  send(message, priority = 'normal') {
    if (!this.connected) {
      console.warn('[NETWORK] Not connected, queuing message');
      return;
    }

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
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(packet));
      }
    });

    this.sendQueue = [];
    this.lastSendTime = now;
  }

  startHeartbeat() {
    setInterval(() => {
      if (this.connected && this.ws.readyState === WebSocket.OPEN) {
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
