
import api from './api';

const scoreService = {

  createScoreboard: async (userId, roomId) => {
    const response = await api.post('/scores/create_scoreboard', {
      userId,
      roomId
    });
    return response.data;
  },

  calculateAnswerScore: async (scoreId, userId, answerId) => {
    const response = await api.patch(`/scores/${scoreId}`, {
      userId,
      answerId,
      sentAt: new Date().toISOString() // Formato ISO-8601
    });
    return response.data;
  },


  deleteScoreboard: async (scoreId) => {
    const response = await api.delete(`/scores/${scoreId}`);
    return response.data;
  }
};

export default scoreService;