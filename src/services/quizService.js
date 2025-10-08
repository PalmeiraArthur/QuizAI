
import api from './api';

const quizService = {

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