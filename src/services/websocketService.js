//src/services/websocketService.js
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

class WebsocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.connectionPromise = null;
  }

  /**
   * Conecta ao endpoint WebSocket
   * @returns {Promise<void>}
   */
  connect() {
    if (this.connectionPromise) {
      console.log("[WEBSOCKET] 🔌 Conexão em andamento, aguardando...");
      return this.connectionPromise;
    }

    if (this.connected && this.client?.connected) {
      console.log("[WEBSOCKET] 🔌 Já conectado.");
      return Promise.resolve();
    }

    console.log("[WEBSOCKET] 🔌 Iniciando conexão...");

    // ✅ Criar e armazenar a promessa de conexão
    this.connectionPromise = new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () =>
          new SockJS("http://localhost:8080/establish-websockets-connection"),

        debug: (str) => {
          // console.debug('[STOMP]', str);
        },

        onConnect: () => {
          console.log("[WEBSOCKET] ✅ Conectado com sucesso!");
          this.connected = true;
          this.connectionPromise = null; // ✅ Limpar a promessa
          resolve();
        },

        onStompError: (frame) => {
          console.error(
            "[WEBSOCKET] ❌ Erro STOMP:",
            frame.headers["message"],
            frame
          );
          this.connected = false;
          this.connectionPromise = null; // ✅ Limpar a promessa
          reject(new Error(`Erro STOMP: ${frame.headers.message}`));
        },

        onWebSocketError: (error) => {
          console.error("[WEBSOCKET] ❌ Erro WebSocket:", error);
          this.connected = false;
          this.connectionPromise = null; // ✅ Limpar a promessa
          reject(error);
        },

        onDisconnect: () => {
          console.log("[WEBSOCKET] 🔌 Desconectado.");
          this.connected = false;
          this.subscriptions.clear();
          this.connectionPromise = null; // ✅ Limpar a promessa
        },

        reconnectDelay: 5000,
      });

      this.client.activate();
    });

    return this.connectionPromise;
  }

  disconnect() {
    if (this.client) {
      console.log("[WEBSOCKET] 🔴 Desconectando...");
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.client.deactivate();
      this.connected = false;
      this.connectionPromise = null; // ✅ Limpar a promessa
    }
  }

  isConnected() {
    return this.connected && this.client?.connected;
  }

  // --------------------------------
  // --- MÉTODOS DE ENVIO (SEND) ---
  // --------------------------------

  sendPlayerJoin(roomId, scoreId) {
    const destination = `/quizAI/sendPlayerJoin/${roomId}`;
    const payload = { scoreId };

    if (!this.client || !this.connected) {
      console.error(
        `[WEBSOCKET] ❌ Não conectado. Não foi possível enviar para ${destination}`
      );
      return;
    }

    try {
      this.client.publish({
        destination,
        body: JSON.stringify(payload),
      });
      console.log(
        `[WEBSOCKET] 📤 Mensagem enviada para ${destination}`,
        payload
      );
    } catch (error) {
      console.error(
        `[WEBSOCKET] ❌ Erro ao enviar para ${destination}:`,
        error
      );
    }
  }

  sendPlayerLeft(roomId, scoreId) {
    const destination = `/quizAI/sendPlayerLeft/${roomId}`;
    const payload = { scoreId };

    if (!this.client || !this.connected) {
      console.error(
        `[WEBSOCKET] ❌ Não conectado. Não foi possível enviar para ${destination}`
      );
      return;
    }

    try {
      this.client.publish({
        destination,
        body: JSON.stringify(payload),
      });
      console.log(
        `[WEBSOCKET] 📤 Mensagem enviada para ${destination}`,
        payload
      );
    } catch (error) {
      console.error(
        `[WEBSOCKET] ❌ Erro ao enviar para ${destination}:`,
        error
      );
    }
  }

  sendPlayerScore(roomId, scoreId, pointsEarned) {
    const destination = `/quizAI/sendPlayerScore/${roomId}`;
    const payload = { scoreId, pointsEarned };

    if (!this.client || !this.connected) {
      console.error(
        `[WEBSOCKET] ❌ Não conectado. Não foi possível enviar para ${destination}`
      );
      return;
    }

    try {
      this.client.publish({
        destination,
        body: JSON.stringify(payload),
      });
      console.log(
        `[WEBSOCKET] 📤 Mensagem enviada para ${destination}`,
        payload
      );
    } catch (error) {
      console.error(
        `[WEBSOCKET] ❌ Erro ao enviar para ${destination}:`,
        error
      );
    }
  }

  /**
   * Notifica todos os players que o host iniciou o jogo
   * @param {string} roomId - ID da sala
   * @param {string} quizId - ID do quiz que será jogado
   */
  sendGameStart(roomId, quizId) {
    const destination = `/quizAI/sendGameStart/${roomId}`;
    const payload = { quizId };

    if (!this.client || !this.connected) {
      console.error(
        `[WEBSOCKET] ❌ Não conectado. Não foi possível enviar para ${destination}`
      );
      return;
    }

    try {
      this.client.publish({
        destination,
        body: JSON.stringify(payload),
      });
      console.log(
        `[WEBSOCKET] 📤 Iniciando jogo para todos os players`,
        payload
      );
    } catch (error) {
      console.error(`[WEBSOCKET] ❌ Erro ao enviar game start:`, error);
    }
  }

  // Novo método para notificar o backend que o host iniciou a contagem para o jogo
  sendStartMatch(roomId) {
    const destination = `/quizAI/sendStartMatch/${roomId}`;
    // Não é necessário payload, apenas a notificação

    if (!this.client || !this.connected) {
      console.error(
        `[WEBSOCKET] ❌ Não conectado. Não foi possível enviar para ${destination}`
      );
      return;
    }

    try {
      this.client.publish({
        destination,
        body: JSON.stringify({ message: "Start Match Initiated" }), // Pode ser um payload vazio ou simples
      });
      console.log(
        `[WEBSOCKET] 📤 Notificação de início de partida enviada para ${destination}`
      );
    } catch (error) {
      console.error(
        `[WEBSOCKET] ❌ Erro ao enviar notificação de início de partida:`,
        error
      );
    }
  }

  // -------------------------------------
  // --- MÉTODOS DE ESCUTA (SUBSCRIBE) ---
  // -------------------------------------

  subscribeToPlayerJoins(roomId, onPlayerJoin) {
    const subscriptionKey = `join-${roomId}`;
    const destination = `/topic/rooms/${roomId}/join`;

    // ✅ Verificação mais rigorosa
    if (!this.client || !this.client.connected) {
      console.error(
        `[WEBSOCKET] ❌ Client não conectado. Não foi possível inscrever em ${destination}`
      );
      return;
    }

    if (this.subscriptions.has(subscriptionKey)) {
      console.warn(`[WEBSOCKET] ⚠️ Já inscrito em ${destination}.`);
      return;
    }

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        console.log(`[WEBSOCKET] 📨 Mensagem recebida de ${destination}`, data);
        onPlayerJoin(data);
      } catch (error) {
        console.error(
          `[WEBSOCKET] ❌ Erro ao processar mensagem de ${destination}:`,
          error
        );
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
    console.log(`[WEBSOCKET] ✅ Inscrito em ${destination}`);
  }

  subscribeToPlayerExits(roomId, onPlayerExit) {
    const subscriptionKey = `exit-${roomId}`;
    const destination = `/topic/rooms/${roomId}/exit`;

    // ✅ Verificação mais rigorosa
    if (!this.client || !this.client.connected) {
      console.error(
        `[WEBSOCKET] ❌ Client não conectado. Não foi possível inscrever em ${destination}`
      );
      return;
    }

    if (this.subscriptions.has(subscriptionKey)) {
      console.warn(`[WEBSOCKET] ⚠️ Já inscrito em ${destination}.`);
      return;
    }

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        console.log(`[WEBSOCKET] 📨 Mensagem recebida de ${destination}`, data);
        onPlayerExit(data);
      } catch (error) {
        console.error(
          `[WEBSOCKET] ❌ Erro ao processar mensagem de ${destination}:`,
          error
        );
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
    console.log(`[WEBSOCKET] ✅ Inscrito em ${destination}`);
  }

  subscribeToScoreUpdates(roomId, onScoreUpdate) {
    const subscriptionKey = `score-${roomId}`;
    const destination = `/topic/rooms/${roomId}/update-score`;

    // ✅ Verificação mais rigorosa
    if (!this.client || !this.client.connected) {
      console.error(
        `[WEBSOCKET] ❌ Client não conectado. Não foi possível inscrever em ${destination}`
      );
      return;
    }

    if (this.subscriptions.has(subscriptionKey)) {
      console.warn(`[WEBSOCKET] ⚠️ Já inscrito em ${destination}.`);
      return;
    }

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        console.log(`[WEBSOCKET] 📨 Mensagem recebida de ${destination}`, data);
        onScoreUpdate(data);
      } catch (error) {
        console.error(
          `[WEBSOCKET] ❌ Erro ao processar mensagem de ${destination}:`,
          error
        );
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
    console.log(`[WEBSOCKET] ✅ Inscrito em ${destination}`);
  }

  // Novo método para assinar atualizações de timer do backend
  subscribeToTimerUpdates(roomId, onTimerUpdate) {
    const subscriptionKey = `timer-${roomId}`;
    const destination = `/topic/rooms/${roomId}/timer`;

    if (!this.client || !this.client.connected) {
      console.error(
        `[WEBSOCKET] ❌ Client não conectado. Não foi possível inscrever em ${destination}`
      );
      return;
    }

    if (this.subscriptions.has(subscriptionKey)) {
      console.warn(`[WEBSOCKET] ⚠️ Já inscrito em ${destination}.`);
      return;
    }

    const subscription = this.client.subscribe(destination, (message) => {
      const timerData = JSON.parse(message.body);
      console.log("[WS] Timer update recebido:", timerData);
      onTimerUpdate(timerData.timeRemainingInSeconds);
    });
    this.subscriptions.set(subscriptionKey, subscription);
    console.log(`[WEBSOCKET] ✅ Inscrito em ${destination}`);
  }

  cleanupSubscriptions(roomId) {
    const joinKey = `join-${roomId}`;
    const exitKey = `exit-${roomId}`;

    if (this.subscriptions.has(joinKey)) {
      this.subscriptions.get(joinKey).unsubscribe();
      this.subscriptions.delete(joinKey);
      console.log(
        `[WEBSOCKET] 🗑️ Inscrição cancelada para /topic/rooms/${roomId}/join`
      );
    }

    if (this.subscriptions.has(exitKey)) {
      this.subscriptions.get(exitKey).unsubscribe();
      this.subscriptions.delete(exitKey);
      console.log(
        `[WEBSOCKET] 🗑️ Inscrição cancelada para /topic/rooms/${roomId}/exit`
      );
    }
    if (this.subscriptions.has(`timer-${roomId}`)) {
      this.subscriptions.get(`timer-${roomId}`).unsubscribe();
      this.subscriptions.delete(`timer-${roomId}`);
      console.log(`[WEBSOCKET] 🧹 Desinscrito de /topic/rooms/${roomId}/timer`);
    }
  }

  subscribeToGameStart(roomId, onGameStart) {
    const subscriptionKey = `game-start-${roomId}`;
    const destination = `/topic/rooms/${roomId}/game-start`;

    if (!this.client || !this.client.connected) {
      console.error(
        `[WEBSOCKET] ❌ Client não conectado. Não foi possível inscrever em ${destination}`
      );
      return;
    }

    if (this.subscriptions.has(subscriptionKey)) {
      console.warn(`[WEBSOCKET] ⚠️ Já inscrito em ${destination}.`);
      return;
    }

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        console.log(
          `[WEBSOCKET] 📨 Jogo iniciado! Navegando para quiz...`,
          data
        );
        onGameStart(data);
      } catch (error) {
        console.error(`[WEBSOCKET] ❌ Erro ao processar game start:`, error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
    console.log(`[WEBSOCKET] ✅ Inscrito em ${destination}`);
  }
}

export default new WebsocketService();
