
import api from './api';

const questionService = {
  getCorrectAnswer: async (questionId) => {
    try {
      const response = await api.get(`/questions/${questionId}/correct-answer`);
      return response.data.correctAnswerId;
    } catch (error) {
      console.error('Erro ao buscar resposta correta:', error);
      throw error;
    }
  }
};

export default questionService;