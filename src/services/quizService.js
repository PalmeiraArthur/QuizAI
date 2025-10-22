import api from './api';

const quizService = {
    // Criar um novo quiz
    createQuiz: async (quizData) => {
        if (!quizData?.topic) {
            throw new Error('Topic is required to create quiz');
        }

        console.log('🎲 Creating quiz:', quizData);

        const requestBody = {
            topic: quizData.topic,
            numberOfQuestions: quizData.numberOfQuestions,
            numberOfAnswers: quizData.numberOfAnswers
        };

        const response = await api.post('/quiz', requestBody);

        console.log('✅ Quiz created successfully:', response.data);
        return response.data;
    },

    // Deletar um quiz
    deleteQuiz: async (quizId) => {
        if (!quizId) throw new Error('quizId é obrigatório');
        return await api.delete(`/quizzes/${quizId}`);
    },

    // Buscar um quiz por ID
    getQuizById: async (quizId) => {
        if (!quizId) throw new Error('quizId é obrigatório');
        const response = await api.get(`/quizzes/${quizId}`);
        return response.data;
    },

    // Buscar quizzes de um usuário
    getQuizzesByUser: async (userId) => {
        if (!userId) throw new Error('userId é obrigatório');
        const response = await api.get(`/quizzes/user/${userId}`);
        return response.data;
    }
};

export default quizService;
