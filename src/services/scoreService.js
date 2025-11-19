import api from './api';

const logAction = (action, details) => {
    console.log(`[SCORE SERVICE] 🚀 ${action}`, details);
};

const throwValidationError = (message, details = null) => {
    console.error(`[SCORE SERVICE] ❌ Validação Falhou: ${message}`, details);
    throw new Error(message);
};

const scoreService = {
    
    /**
     * Calcula a pontuação de uma resposta enviada por um usuário.
     * Corresponde ao endpoint PATCH /scores/{id} no backend.
     * @param {string} scoreId - O ID do registro de Score do jogador.
     * @param {string} userId - O ID do usuário que respondeu.
     * @param {string} answerId - O ID da resposta escolhida.
     * @param {string} roomId - O ID da sala (OBRIGATÓRIO no backend).
     * @returns {Promise<object>} Retorna o objeto ScoreResponseDTO do backend, contendo 'pointsEarned'.
     */
    calculateAnswerScore: async (scoreId, userId, answerId, roomId) => {
        if (!scoreId || !userId || !answerId || !roomId) {
            throwValidationError('Dados incompletos para calcular a pontuação. scoreId, userId, answerId e roomId são obrigatórios!');
        }

        logAction('Calculando pontuação da resposta', { scoreId, userId, answerId, roomId });

        // O backend espera o AnswerRequestDTO (com userId, answerId e roomId)
        const payload = {
            userId,
            answerId,
            roomId
        };

        const response = await api.patch(`/scores/${scoreId}`, payload);
        
        logAction('Pontuação calculada com sucesso', response.data);

        // O retorno esperado é { pointsEarned: Integer }
        return response.data;
    },
};

export default scoreService;