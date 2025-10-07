// src/pages/playQuiz.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';

function PlayQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Buscar quiz do localStorage
    const savedQuiz = localStorage.getItem(`quiz_${id}`);
    
    if (savedQuiz) {
      const quizData = JSON.parse(savedQuiz);
      // Converter Set para Array para facilitar manipulação
      const questionsArray = Array.from(quizData.questions);
      
      setQuiz({ ...quizData, questions: questionsArray });
    } else {
      alert('Quiz não encontrado!');
      navigate('/');
    }
  }, [id, navigate]);

  const handleSelectAnswer = (questionId, answerId) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Última questão - mostrar resultados
      calculateScore();
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    // Por enquanto, calcular score localmente
    // TODO: Integrar com o endpoint de score quando tiver sala
    let correctAnswers = 0;
    
    quiz.questions.forEach(question => {
      const selectedAnswerId = selectedAnswers[question.id];
      // Aqui você precisaria saber qual resposta é a correta
      // Como o backend não retorna isso, vamos simular
      if (selectedAnswerId) {
        correctAnswers++;
      }
    });

    setScore(correctAnswers);
  };

  const handlePlayAgain = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  if (!quiz) {
    return (
      <div className="min-h-screen bg-darkGunmetal flex items-center justify-center">
        <div className="text-white text-xl">Carregando quiz...</div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const answersArray = Array.from(currentQuestion.answers);
  const selectedAnswer = selectedAnswers[currentQuestion.id];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  if (showResults) {
    return (
      <div className="min-h-screen bg-darkGunmetal">
        <Navbar />
        <main className="container mx-auto px-4 py-8 mt-[100px] md:mt-[100px]">
          <div className="max-w-2xl mx-auto">
            <div className="bg-raisinBlack rounded-lg shadow-xl p-8 text-center">
              <h1 className="text-4xl font-bold text-white mb-4">
                Quiz Finalizado!
              </h1>
              
              <div className="my-8">
                <div className="text-6xl font-bold text-pistachio mb-4">
                  {score}/{quiz.questions.length}
                </div>
                <p className="text-gray-400 text-xl">
                  Você acertou {score} de {quiz.questions.length} questões
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handlePlayAgain}
                  className="flex-1 bg-pistachio text-raisinBlack font-bold py-3 px-6 rounded-lg hover:bg-green-500 transition-colors"
                >
                  Jogar Novamente
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Voltar para Home
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkGunmetal">
      <Navbar />

      <main className="container mx-auto px-4 py-8 mt-[100px] md:mt-[100px]">
        <div className="max-w-3xl mx-auto">
          {/* Header com progresso */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-white font-semibold">{quiz.topic}</h2>
              <span className="text-gray-400">
                Questão {currentQuestionIndex + 1} de {quiz.questions.length}
              </span>
            </div>
            <div className="w-full bg-darkGunmetal rounded-full h-2">
              <div
                className="bg-pistachio h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Questão */}
          <div className="bg-raisinBlack rounded-lg shadow-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-8">
              {currentQuestion.value}
            </h3>

            {/* Alternativas */}
            <div className="space-y-4">
              {answersArray.map((answer, index) => (
                <button
                  key={answer.id}
                  onClick={() => handleSelectAnswer(currentQuestion.id, answer.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedAnswer === answer.id
                      ? 'border-pistachio bg-pistachio/10 text-white'
                      : 'border-plumpPurple/30 bg-darkGunmetal hover:border-plumpPurple text-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-plumpPurple/20 flex items-center justify-center mr-4 font-bold text-white">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{answer.value}</span>
                    {selectedAnswer === answer.id && (
                      <svg className="w-6 h-6 text-pistachio" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Botão próxima questão */}
            <button
              onClick={handleNextQuestion}
              disabled={!selectedAnswer}
              className="w-full mt-8 bg-pistachio text-raisinBlack font-bold py-4 px-6 rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {currentQuestionIndex === quiz.questions.length - 1 ? 'Finalizar' : 'Próxima Questão'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PlayQuiz;