//roomService.js
import api from './api';

const roomService = {
    createRoom: async ({ ownerId, isPublic = true, maxNumberOfPlayers = 10 }) => {

        const payload = {
            ownerId,
            isPublic,
            maxNumberOfPlayersInRoom: maxNumberOfPlayers,
        };

        try {
            const response = await api.post('/rooms', payload);
            return response.data;

        } catch (error) {
            console.error('Erro ao tentar criar a sala:', error);
            throw error;
        }
    },

    joinRoom: async (roomCode, userId) => {
        const response = await api.post(`/rooms/join/${roomCode}`, { userId });

        return response.data;
    },

    exitRoom: async (scoreId) => {
        await api.delete(`/rooms/exit/${scoreId}`);
        return;
    },

    updateRoom: async (roomId, updateData) => {
        const { ownerId } = updateData;


        const payload = {
            ownerId,
            isPublic: updateData.isPublic,
            maxNumberOfPlayers: updateData.maxNumberOfPlayers,
            quizId: updateData.quizId
        };

        const response = await api.patch(`/rooms/${roomId}`, payload);
        return response.data;
    },

    deleteRoom: async (roomId, userId) => {


        const payload = { userId };

        await api.delete(`/rooms/${roomId}`, {
            data: payload, // Axios envia { "userId": "..." } no corpo da requisição
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return;
    },

    getPublicRooms: async () => {
        const response = await api.get('/rooms');
        return response.data;
    },

    getRoomData: async (roomId) => {
        try {
            const response = await api.get(`/rooms/${roomId}`);

            console.log('FRONTEND: Dados da sala retornados:', response.data);

            return response.data;
            

        } catch (error) {
            console.error(`Erro ao tentar buscar a sala ${roomId}:`, error);
            throw error;
        }
    },
};



export default roomService;