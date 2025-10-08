// src/pages/playQuiz.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import scoreService from '../services/scoreService';
import Navbar from '../components/navbar';

function PlayQuiz() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [scoreId, setScoreId] = useState(null);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  useEffect(() => {
    const initializeGame = async () => {

      const savedQuiz = localStorage.getItem(`quiz_${id}`);
      
      if (!savedQuiz) {
        alert('Quiz não encontrado!');
        navigate('/');
        return;
      }

      const quizData = JSON.parse(savedQuiz);
      const questionsArray = Array.from(quizData.questions);
      setQuiz({ ...quizData, questions: questionsArray });

      // Cria o scoreboard
      if (roomId) {
        try {
          const userId = localStorage.getItem('userId');
          const scoreboard = await scoreService.createScoreboard(userId, roomId);
          setScoreId(scoreboard.id);
          console.log('Scoreboard criado:', scoreboard);
        } catch (err) {
          console.error('Erro ao criar scoreboard:', err);
        }
      }
    };

    initializeGame();
  }, [id, roomId, navigate]);

  const handleSelectAnswer = (answerId) => {
    if (!isAnswerSubmitted) {
      setSelectedAnswer(answerId);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !scoreId) return;

    try {
      setIsAnswerSubmitted(true);
      const userId = localStorage.getItem('userId');
      
      const result = await scoreService.calculateAnswerScore(
        scoreId,
        userId,
        selectedAnswer
      );

      console.log('Pontuação atual:', result.totalUserPoints);
      setScore(result.totalUserPoints);

      setAnsweredQuestions(prev => [...prev, {
        questionId: quiz.questions[currentQuestionIndex].id,
        answerId: selectedAnswer,
        points: result.totalUserPoints
      }]);

      setTimeout(() => {
        handleNextQuestion();
      }, 1500);

    } catch (err) {
      console.error('Erro ao calcular pontuação:', err);
      alert('Erro ao enviar resposta. Tente novamente.');
      setIsAnswerSubmitted(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      
      setShowResults(true);
    }
  };

  const handlePlayAgain = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResults(false);
    setScore(0);
    setAnsweredQuestions([]);
    setIsAnswerSubmitted(false);
    navigate('/');
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
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  if (showResults) {
    return (
      <div className="min-h-screen bg-darkGunmetal flex justify-center w-[1140px]">
        <Navbar />
        <main className="container mx-auto px-4 py-8 mt-[100px] md:mt-[100px]">
          <div className="max-w-2xl mx-auto">
            <div className="bg-raisinBlack rounded-lg shadow-xl p-8 text-center">
              <h1 className="text-4xl font-bold text-white mb-4">
                Quiz Finalizado!
              </h1>
              
              <div className="my-8">
                <div className="text-6xl font-bold text-pistachio mb-4">
                  {score} pontos
                </div>
                <p className="text-gray-400 text-xl">
                  Você completou {quiz.questions.length} questões
                </p>
              </div>

              <div className="bg-darkGunmetal/50 rounded-lg p-6 mb-6">
                <h3 className="text-white font-semibold mb-4">Resumo</h3>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between text-gray-300">
                    <span>Quiz:</span>
                    <span className="text-pistachio font-semibold">{quiz.topic}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Questões respondidas:</span>
                    <span className="text-white">{answeredQuestions.length}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Pontuação final:</span>
                    <span className="text-pistachio font-bold text-xl">{score}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handlePlayAgain}
                  className="flex-1 bg-pistachio text-raisinBlack font-bold py-3 px-6 rounded-lg hover:bg-green-500 transition-colors"
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
    <div className="min-h-screen bg-darkGunmetal flex justify-center w-[1140px]">
      <Navbar />

      <main className="container mx-auto mt-[100px] md:mt-[100px]">
        
        <div className="max-w-5xl mx-auto">
          
          {/* Header com progresso e pontuação */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h2 className="text-white font-semibold">{quiz.topic}</h2>
                <span className="text-gray-400 text-sm">
                  Questão {currentQuestionIndex + 1} de {quiz.questions.length}
                </span>
              </div>
              <div className="text-right">
                <div className="text-pistachio font-bold text-2xl">{score}</div>
                <div className="text-gray-400 text-xs">pontos</div>
              </div>
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
                  onClick={() => handleSelectAnswer(answer.id)}
                  disabled={isAnswerSubmitted}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedAnswer === answer.id
                      ? 'border-pistachio bg-pistachio/10 text-white'
                      : 'border-plumpPurple/30 bg-darkGunmetal hover:border-plumpPurple text-gray-300'
                  } ${isAnswerSubmitted ? 'opacity-75 cursor-not-allowed' : ''}`}
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

            {/* Botão de enviar resposta */}
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer || isAnswerSubmitted}
              className="w-full mt-8 bg-pistachio text-raisinBlack font-bold py-4 px-6 rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isAnswerSubmitted ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Calculando pontuação...
                </span>
              ) : currentQuestionIndex === quiz.questions.length - 1 ? (
                'Finalizar Quiz'
              ) : (
                'Confirmar Resposta'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PlayQuiz;