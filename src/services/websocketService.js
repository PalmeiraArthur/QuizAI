import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
    constructor() {
        this.client = null;
        this.connected = false;
        this.subscriptions = new Map(); // Armazena as inscrições ativas
    }

    /**
     * Conecta ao endpoint WebSocket
     * @returns {Promise<void>}
     */
    connect() {
        return new Promise((resolve, reject) => {
            if (this.connected && this.client) {
                console.log('[WEBSOCKET] 🔌 Já conectado.');
                resolve();
                return;
            }

            console.log('[WEBSOCKET] 🔌 Iniciando conexão...');

            this.client = new Client({
                webSocketFactory: () =>
                    new SockJS('http://localhost:8080/establish-websockets-connection'),

                // Logs de debug do STOMP (opcional)
                debug: (str) => {
                    // console.debug('[STOMP]', str);
                },

                onConnect: () => {
                    console.log('[WEBSOCKET] ✅ Conectado com sucesso!');
                    this.connected = true;
                    resolve();
                },

                onStompError: (frame) => {
                    console.error('[WEBSOCKET] ❌ Erro STOMP:', frame.headers['message'], frame);
                    this.connected = false;
                    reject(new Error(`Erro STOMP: ${frame.headers.message}`));
                },

                onWebSocketError: (error) => {
                    console.error('[WEBSOCKET] ❌ Erro WebSocket:', error);
                    this.connected = false;
                    reject(error);
                },

                onDisconnect: () => {
                    console.log('[WEBSOCKET] 🔌 Desconectado.');
                    this.connected = false;
                    this.subscriptions.clear();
                },

                reconnectDelay: 5000,
            });

            this.client.activate();
        });
    }

    /**
     * Desconecta completamente do WebSocket
     */
    disconnect() {
        if (this.client) {
            console.log('[WEBSOCKET] 🔴 Desconectando...');
            // Cancela todas as inscrições antes de desativar
            this.subscriptions.forEach((sub) => sub.unsubscribe());
            this.subscriptions.clear();

            this.client.deactivate();
            this.connected = false;
        }
    }

    /**
     * Verifica se está conectado
     * @returns {boolean}
     */
    isConnected() {
        return this.connected;
    }

    // --------------------------------
    // --- MÉTODOS DE ENVIO (SEND) ---
    // --------------------------------

    /** Envia evento de entrada na sala */
    sendPlayerJoin(roomId, scoreId) {
        const destination = `/quizAI/sendPlayerJoin/${roomId}`;
        const payload = { scoreId };

        if (!this.client || !this.connected) {
            console.error(`[WEBSOCKET] ❌ Não conectado. Não foi possível enviar para ${destination}`);
            return;
        }

        try {
            this.client.publish({
                destination,
                body: JSON.stringify(payload),
            });
            console.log(`[WEBSOCKET] 📤 Mensagem enviada para ${destination}`, payload);
        } catch (error) {
            console.error(`[WEBSOCKET] ❌ Erro ao enviar para ${destination}:`, error);
        }
    }

    /** Envia evento de saída da sala */
    sendPlayerLeft(roomId, scoreId) {
        const destination = `/quizAI/sendPlayerLeft/${roomId}`;
        const payload = { scoreId };

        if (!this.client || !this.connected) {
            console.error(`[WEBSOCKET] ❌ Não conectado. Não foi possível enviar para ${destination}`);
            return;
        }

        try {
            this.client.publish({
                destination,
                body: JSON.stringify(payload),
            });
            console.log(`[WEBSOCKET] 📤 Mensagem enviada para ${destination}`, payload);
        } catch (error) {
            console.error(`[WEBSOCKET] ❌ Erro ao enviar para ${destination}:`, error);
        }
    }

    /** Envia atualização de pontuação */
    sendPlayerScore(roomId, scoreId, pointsEarned) {
        const destination = `/quizAI/sendPlayerScore/${roomId}`;
        const payload = { scoreId, pointsEarned };

        if (!this.client || !this.connected) {
            console.error(`[WEBSOCKET] ❌ Não conectado. Não foi possível enviar para ${destination}`);
            return;
        }

        try {
            this.client.publish({
                destination,
                body: JSON.stringify(payload),
            });
            console.log(`[WEBSOCKET] 📤 Mensagem enviada para ${destination}`, payload);
        } catch (error) {
            console.error(`[WEBSOCKET] ❌ Erro ao enviar para ${destination}:`, error);
        }
    }

    // -------------------------------------
    // --- MÉTODOS DE ESCUTA (SUBSCRIBE) ---
    // -------------------------------------

    /** Inscreve para receber atualizações de entrada de jogadores */
    subscribeToPlayerJoins(roomId, onPlayerJoin) {
        const subscriptionKey = `join-${roomId}`;
        const destination = `/topic/rooms/${roomId}/join`;

        if (!this.client || !this.connected) {
            console.error(`[WEBSOCKET] ❌ Não conectado. Não foi possível inscrever em ${destination}`);
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
                console.error(`[WEBSOCKET] ❌ Erro ao processar mensagem de ${destination}:`, error);
            }
        });

        this.subscriptions.set(subscriptionKey, subscription);
        console.log(`[WEBSOCKET] ✅ Inscrito em ${destination}`);
    }

    /** Inscreve para receber atualizações de saída de jogadores */
    subscribeToPlayerExits(roomId, onPlayerExit) {
        const subscriptionKey = `exit-${roomId}`;
        const destination = `/topic/rooms/${roomId}/exit`;

        if (!this.client || !this.connected) {
            console.error(`[WEBSOCKET] ❌ Não conectado. Não foi possível inscrever em ${destination}`);
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
                console.error(`[WEBSOCKET] ❌ Erro ao processar mensagem de ${destination}:`, error);
            }
        });

        this.subscriptions.set(subscriptionKey, subscription);
        console.log(`[WEBSOCKET] ✅ Inscrito em ${destination}`);
    }

    /** Inscreve para receber atualizações de pontuação */
    subscribeToScoreUpdates(roomId, onScoreUpdate) {
        const subscriptionKey = `score-${roomId}`;
        const destination = `/topic/rooms/${roomId}/update-score`;

        if (!this.client || !this.connected) {
            console.error(`[WEBSOCKET] ❌ Não conectado. Não foi possível inscrever em ${destination}`);
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
                console.error(`[WEBSOCKET] ❌ Erro ao processar mensagem de ${destination}:`, error);
            }
        });

        this.subscriptions.set(subscriptionKey, subscription);
        console.log(`[WEBSOCKET] ✅ Inscrito em ${destination}`);
    }
}

export default new WebSocketService();