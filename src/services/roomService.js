
import api from './api';

const roomService = {
  
  createRoom: async (ownerId, isPublic = true, maxNumberOfPlayers = 10) => {
    const response = await api.post('/rooms', {
      ownerId,
      isPublic,
      maxNumberOfPlayersInRoom: maxNumberOfPlayers
    });
    return response.data;
  },


  updateRoom: async (roomId, ownerId, quizId, options = {}) => {
    await api.patch(`/rooms/${roomId}`, {
      ownerId,
      quizId,
      ...options
    });
    return true;
  },

  deleteRoom: async (roomId, userId) => {
    await api.delete(`/rooms/${roomId}`, {
      data: JSON.stringify(userId),
      headers: { 'Content-Type': 'application/json' }
    });
    return true;
  }
};

export default roomService;