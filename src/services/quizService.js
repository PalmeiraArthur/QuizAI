// src/services/quizService.js
import api from './api';

const quizService = {
  /**
   * Gerar quiz usando IA
   * POST /quiz
   * Body: { topic: string, numberOfQuestions: number, numberOfAnswers: number }
   * Response: QuizResponseDTO { id: UUID, topic: string, questions: Set<QuestionDTO> }
   */
  generateQuiz: async (topic, numberOfQuestions, numberOfAnswers) => {
    const response = await api.post('/quiz', {
      topic,
      numberOfQuestions,
      numberOfAnswers
    });
    return response.data;
  }
};

export default quizService;