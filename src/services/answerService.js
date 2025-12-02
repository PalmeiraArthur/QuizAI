import api from './api';

const logAction = (action, details) => {
    console.log(`[ANSWER SERVICE] 🚀 ${action}`, details);
};

const answerService = {
    
    /**
     * Processa a resposta do jogador.
     * Recebe um objeto único com os parâmetros (padrão usado no PlayQuiz).
     */
    processPlayerAnswer: async ({ playerId, answerId, roomId, questionId, scoreId }) => {
        // Validação
        if (!playerId || !answerId || !roomId || !questionId || !scoreId) {
            console.error("Dados faltantes:", { playerId, answerId, roomId, questionId, scoreId });
            throw new Error('Dados incompletos para processar a resposta.');
        }

        logAction('Enviando resposta...', { playerId, roomId, questionId });

        // Payload idêntico ao AnswerRequestDTO do Java
        const payload = {
            playerId,
            answerId,
            roomId,
            questionId,
            scoreId
        };

        try {
            const response = await api.patch('/answer', payload);
            
            logAction('Resposta processada com sucesso', response.data);
            
            // Retorna: { pointsEarned, correctAnswerId, playerAnswerId }
            return response.data; 
        } catch (error) {
            console.error('[ANSWER SERVICE] ❌ Erro ao processar resposta:', error);
            throw error;
        }
    },
};

export default answerService;