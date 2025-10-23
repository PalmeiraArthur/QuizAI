import api from './api';

const logAction = (action, details) => {
    console.log(`[ROOM SERVICE] 🚀 ${action}`, details);
};

const throwValidationError = (message, details = null) => {
    console.error(`[ROOM SERVICE] ❌ Validação Falhou: ${message}`, details);
    throw new Error(message);
};

const roomService = {
    createRoom: async ({ ownerId, isPublic = true, maxNumberOfPlayers = 10 }) => {
        if (!ownerId) {
            throwValidationError('Usuário não identificado. Faça login novamente.');
        }

        logAction('Criando sala', { ownerId, isPublic, maxNumberOfPlayers });

        const payload = {
            ownerId,
            isPublic,
            maxNumberOfPlayersInRoom: maxNumberOfPlayers,
        };

        try {
            const response = await api.post('/rooms', payload);
            logAction('Sala criada com sucesso', response.data);
            return response.data;
        } catch (error) {
            console.error('[ROOM SERVICE] Erro ao criar sala:', error);
            throw new Error(error.response?.data?.message || 'Erro ao criar sala');
        }
    },

    joinRoom: async (roomCode, userId) => {
        if (!roomCode || !userId) {
            throwValidationError('Código da sala ou ID do usuário inválidos para entrar.');
        }

        logAction('Entrando na sala', { roomCode, userId });

        const response = await api.post(`/rooms/join/${roomCode}`, { userId });

        logAction('Entrada na sala bem-sucedida', response.data);
        return response.data;
    },

    exitRoom: async (scoreId) => {
        if (!scoreId) {
            throwValidationError('ID do Score não fornecido para sair da sala.');
        }

        logAction('Saindo da sala (deletando Score)', { scoreId });
        await api.delete(`/rooms/exit/${scoreId}`);
        logAction('Saída da sala bem-sucedida');
        return;
    },

    updateRoom: async (roomId, updateData) => {
        // updateData agora é o objeto { ownerId, isPublic, maxNumberOfPlayers, quizId }
        const { ownerId } = updateData;

        // A validação agora checa se o updateData é válido
        if (!roomId || !ownerId) {
            throwValidationError('Dados inválidos para atualização da sala.', { roomId, ownerId });
        }

        logAction('Atualizando sala', { roomId, updateData });

        const payload = {
            ownerId,
            isPublic: updateData.isPublic,
            maxNumberOfPlayers: updateData.maxNumberOfPlayers,
            quizId: updateData.quizId // O backend aceita null
        };

        const response = await api.patch(`/rooms/${roomId}`, payload);
        logAction('Sala atualizada com sucesso', response.data);
        return response.data;
    },

    deleteRoom: async (roomId, userId) => {
        if (!roomId || !userId) {
            throwValidationError('Dados inválidos para deletar sala.', { roomId, userId });
        }

        logAction('Deletando sala', { roomId, userId });
        await api.delete(`/rooms/${roomId}`, {
            data: JSON.stringify(userId),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        logAction('Sala deletada com sucesso');
        return;
    },

    getPublicRooms: async () => {
        logAction('Buscando salas públicas');
        const response = await api.get('/rooms');
        return response.data;
    },
};

export default roomService;