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
   * Envia pedido para iniciar a partida (usado pelo host)
   * @param {string} roomId - ID da sala
   * @param {string} playerId - ID do player (host)
   */
  sendStartMatch(roomId, playerId) {
    const destination = `/quizAI/sendStartMatch/${roomId}`;
    const payload = { playerId };

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
        `[WEBSOCKET] 📤 Pedido de início de partida enviado para ${destination}`,
        payload
      );
    } catch (error) {
      console.error(
        `[WEBSOCKET] ❌ Erro ao enviar início de partida:`,
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

  /**
   * Assina contagem regressiva antes do quiz começar
   * @param {string} roomId - ID da sala
   * @param {function} onCountdownUpdate - Callback que recebe o tempo restante
   */
  subscribeToStartMatchCountdown(roomId, onCountdownUpdate) {
    const subscriptionKey = `start-match-countdown-${roomId}`;
    const destination = `/topic/room/${roomId}/start-match-countdown`;

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
          `[WEBSOCKET] 📨 Start match countdown update:`,
          data.timeRemainingInSeconds
        );
        onCountdownUpdate(data.timeRemainingInSeconds);
      } catch (error) {
        console.error(
          `[WEBSOCKET] ❌ Erro ao processar start match countdown:`,
          error
        );
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
    console.log(`[WEBSOCKET] ✅ Inscrito em ${destination}`);
  }

  /**
   * Assina recebimento de questões
   * @param {string} roomId - ID da sala
   * @param {function} onQuestionReceived - Callback que recebe os dados da questão
   */
  subscribeToQuestion(roomId, onQuestionReceived) {
    const subscriptionKey = `question-${roomId}`;
    const destination = `/topic/room/${roomId}/question`;

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
        console.log(`[WEBSOCKET] 📨 Nova questão recebida:`, data);
        onQuestionReceived(data);
      } catch (error) {
        console.error(
          `[WEBSOCKET] ❌ Erro ao processar questão recebida:`,
          error
        );
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
    console.log(`[WEBSOCKET] ✅ Inscrito em ${destination}`);
  }

  /**
   * Assina contagem regressiva das questões
   * @param {string} roomId - ID da sala
   * @param {function} onCountdownUpdate - Callback que recebe o tempo restante
   */
  subscribeToQuestionCountdown(roomId, onCountdownUpdate) {
    const subscriptionKey = `question-countdown-${roomId}`;
    const destination = `/topic/room/${roomId}/question-countdown`;

    if (!this.client || !this.client.connected) {
      console.error(
        `[WEBSOCKET] ❌ Client não conectado. Não foi possível inscrever em ${destination}`
      );
      return;
    }

    // Se já temos uma subscrição, limpar primeiro
    if (this.subscriptions.has(subscriptionKey)) {
      console.warn(
        `[WEBSOCKET] ⚠️ Já inscrito em ${destination}. Limpando subscrição antiga...`
      );
      this.subscriptions.get(subscriptionKey).unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }

    console.log(`[WEBSOCKET] 🔄 Criando nova subscrição para ${destination}`);

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        console.log(
          `[WEBSOCKET] 📨 Question countdown update:`,
          data.timeRemainingInSeconds
        );
        onCountdownUpdate(data.timeRemainingInSeconds);
      } catch (error) {
        console.error(`[WEBSOCKET] ❌ Erro ao processar countdown:`, error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
    console.log(`[WEBSOCKET] ✅ Inscrito em ${destination}`);
  }

  /**
   * Assina início do jogo (game start)
   * @param {string} roomId - ID da sala
   * @param {function} onGameStart - Callback que recebe os dados do início do jogo
   */
  subscribeToGameStart(roomId, onGameStart) {
    const subscriptionKey = `game-start-${roomId}`;
    const destination = `/topic/room/${roomId}/game-start`;

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
        console.log(`[WEBSOCKET] 📨 Game start recebido:`, data);
        onGameStart(data);
      } catch (error) {
        console.error(`[WEBSOCKET] ❌ Erro ao processar game start:`, error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
    console.log(`[WEBSOCKET] ✅ Inscrito em ${destination}`);
  }

  /**
   * Limpa todas as subscrições relacionadas à uma sala
   * @param {string} roomId - ID da sala
   */
  cleanupRoomSubscriptions(roomId) {
    const keys = [
      `join-${roomId}`,
      `exit-${roomId}`,
      `timer-${roomId}`,
      `start-match-countdown-${roomId}`,
      `question-${roomId}`,
      `question-countdown-${roomId}`,
      `game-start-${roomId}`, 
    ];

    keys.forEach((key) => {
      if (this.subscriptions.has(key)) {
        this.subscriptions.get(key).unsubscribe();
        this.subscriptions.delete(key);
        console.log(`[WEBSOCKET] 🗑️ Inscrição cancelada: ${key}`);
      }
    });
  }


}

export default new WebsocketService();
