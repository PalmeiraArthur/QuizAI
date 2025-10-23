import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const logAction = (action, details) => {
    console.log(`[WEBSOCKET SERVICE] 🔌 ${action}`, details);
};

class WebSocketService {
    constructor() {
        this.client = null;
        this.connected = false;
        this.subscriptions = new Map(); // Armazena as inscrições ativas
    }

    /**
     * Conecta ao WebSocket e inscreve em um tópico de sala
     * @param {string} roomId - ID da sala
     * @param {function} onScoreUpdate - Callback quando receber atualização de score
     * @returns {Promise<void>}
     */
    connect(roomId, onScoreUpdate) {
        return new Promise((resolve, reject) => {
            // Se já está conectado, apenas inscreve no tópico
            if (this.connected && this.client) {
                this.subscribeToRoom(roomId, onScoreUpdate);
                resolve();
                return;
            }

            logAction('Iniciando conexão WebSocket', { roomId });

            this.client = new Client({
                webSocketFactory: () => 
                    new SockJS('http://localhost:8080/establish-websockets-connection'),
                
                debug: (str) => {
                    console.debug('[STOMP]', str);
                },
                
                onConnect: () => {
                    logAction('✅ WebSocket conectado com sucesso!');
                    this.connected = true;
                    
                    // Inscreve no tópico da sala
                    this.subscribeToRoom(roomId, onScoreUpdate);
                    
                    resolve();
                },
                
                onStompError: (frame) => {
                    console.error('[WEBSOCKET SERVICE] ❌ Erro STOMP:', frame);
                    this.connected = false;
                    reject(new Error(`Erro STOMP: ${frame.headers.message}`));
                },
                
                onWebSocketError: (error) => {
                    console.error('[WEBSOCKET SERVICE] ❌ Erro WebSocket:', error);
                    this.connected = false;
                    reject(error);
                },

                onDisconnect: () => {
                    logAction('Desconectado do WebSocket');
                    this.connected = false;
                    this.subscriptions.clear();
                },

                // Configurações de reconexão automática
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            });

            this.client.activate();
        });
    }

    /**
     * Inscreve em um tópico de sala específico
     * @param {string} roomId - ID da sala
     * @param {function} onScoreUpdate - Callback para processar mensagens
     */
    subscribeToRoom(roomId, onScoreUpdate) {
        if (!this.client || !this.connected) {
            console.error('[WEBSOCKET SERVICE] ❌ Cliente não conectado');
            return;
        }

        // Evita inscrições duplicadas
        if (this.subscriptions.has(roomId)) {
            logAction('⚠️ Já inscrito na sala', { roomId });
            return;
        }

        const destination = `/topic/rooms/${roomId}/update-score`;
        
        const subscription = this.client.subscribe(destination, (message) => {
            try {
                const data = JSON.parse(message.body);
                logAction('📨 Mensagem recebida', { roomId, data });
                onScoreUpdate(data);
            } catch (error) {
                console.error('[WEBSOCKET SERVICE] ❌ Erro ao processar mensagem:', error);
            }
        });

        this.subscriptions.set(roomId, subscription);
        logAction('✅ Inscrito no tópico da sala', { roomId, destination });
    }

    /**
     * Envia a pontuação de um jogador para broadcast
     * @param {string} roomId - ID da sala
     * @param {string} scoreId - ID do score do jogador
     * @param {number} pointsEarned - Pontos ganhos
     */
    sendScore(roomId, scoreId, pointsEarned) {
        if (!this.client || !this.connected) {
            console.error('[WEBSOCKET SERVICE] ❌ WebSocket não está conectado');
            return;
        }

        const destination = `/quizAI/sendPlayerScoreboard/${roomId}`;
        const payload = {
            scoreId,
            pointsEarned,
        };

        logAction('📤 Enviando pontuação', { roomId, payload });

        this.client.publish({
            destination,
            body: JSON.stringify(payload),
        });
    }

    /**
     * Cancela inscrição de uma sala específica
     * @param {string} roomId - ID da sala
     */
    unsubscribeFromRoom(roomId) {
        const subscription = this.subscriptions.get(roomId);
        
        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(roomId);
            logAction('✅ Desinscrição da sala concluída', { roomId });
        }
    }

    /**
     * Desconecta completamente do WebSocket
     */
    disconnect() {
        if (this.client) {
            // Cancela todas as inscrições
            this.subscriptions.forEach((subscription) => subscription.unsubscribe());
            this.subscriptions.clear();
            
            // Desativa o cliente
            this.client.deactivate();
            this.connected = false;
            
            logAction('🔴 WebSocket desconectado completamente');
        }
    }

    /**
     * Verifica se está conectado
     * @returns {boolean}
     */
    isConnected() {
        return this.connected;
    }
}

// Exporta uma instância singleton
export default new WebSocketService();