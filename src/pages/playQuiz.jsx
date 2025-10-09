// src/pages/playQuiz.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import scoreService from '../services/scoreService';
import Navbar from '../components/navbar';
import clickSound from '../assets/sounds/click.mp3'

function PlayQuiz() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null); // ← NOVO
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [scoreId, setScoreId] = useState(null);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const clickSoundRef = useRef(new Audio(clickSound));


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

  const handleSelectAnswer = async (answerId) => {
    if (isAnswerSubmitted || !scoreId) return;

    // 🔊 tocar som de clique
    clickSoundRef.current.currentTime = 0;
    clickSoundRef.current.play();

    try {

      setIsAnswerSubmitted(true);
      setSelectedAnswer(answerId);
      const userId = localStorage.getItem('userId');

      const result = await scoreService.calculateAnswerScore(
        scoreId,
        userId,
        answerId
      );

      const points = result.pointsEarned;
      console.log('Pontos ganhos nesta rodada:', points);

      // Se errou, encontrar a resposta certa para mostrar em verde
      if (points === 0) {
        // Como o backend não retorna qual é a certa, precisamos encontrar
        // Mas por enquanto, vamos apenas marcar a errada em vermelho
        // Você precisaria adicionar um endpoint no backend para retornar a resposta certa
        // Ou salvar essa informação quando criar o quiz
      }

      // Mostrar animação de pontos
      setPointsEarned(points);
      setShowPointsAnimation(true);

      // Somar pontos ao total
      setScore(prevScore => prevScore + points);

      setAnsweredQuestions(prev => [...prev, {
        questionId: quiz.questions[currentQuestionIndex].id,
        answerId: answerId,
        pointsEarned: points
      }]);

      // Aumentei para 3 segundos para dar tempo de ver as cores
      setTimeout(() => {
        setShowPointsAnimation(false);
        handleNextQuestion();
      }, 3000); // ← Mudei de 2000 para 3000

    } catch (err) {
      console.error('Erro ao calcular pontuação:', err);
      alert('Erro ao enviar resposta. Tente novamente.');
      setIsAnswerSubmitted(false);
      setSelectedAnswer(null);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setCorrectAnswer(null); // ← Limpar resposta certa
      setIsAnswerSubmitted(false);
    } else {
      setShowResults(true);
    }
  };

  const handlePlayAgain = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setCorrectAnswer(null);
    setShowResults(false);
    setScore(0);
    setAnsweredQuestions([]);
    setIsAnswerSubmitted(false);
    navigate('/');
  };

  // Função para determinar a cor da alternativa
  const getAnswerStyle = (answer) => {
    if (!isAnswerSubmitted) {
      // Antes de responder - estado normal
      return 'bg-silver  hover:border-plumpPurple text-raisinBlack hover:scale-102 cursor-pointer';
    }

    // Depois de responder
    if (answer.id === selectedAnswer) {
      // A que foi selecionada
      if (pointsEarned > 0) {
        // Acertou - verde
        return 'bg-green-500 border-green-600 text-white scale-105';
      } else {
        // Errou - vermelho
        return 'bg-red-500 border-red-600 text-white scale-105';
      }
    }

    // Outras alternativas ficam normais
    return 'bg-silver text-raisinBlack opacity-50';
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
                <h2 className="text-white font-semibold text-[30px]">{quiz.topic}</h2>
                <span className="text-gray-400 text-[18px]">
                  Questão {currentQuestionIndex + 1} de {quiz.questions.length}
                </span>
              </div>
              <div className="text-right relative">
                <div className="text-pistachio font-bold text-[40px]">{score}</div>
                <div className="text-gray-400 text-[18px]">pontos</div>

                {/* ANIMAÇÃO DE PONTOS */}
                {showPointsAnimation && (
                  <div className={`absolute -top-2 right-0 text-4xl font-bold animate-float ${pointsEarned > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                    {pointsEarned > 0 ? `+${pointsEarned}` : '0'}
                  </div>
                )}
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
          <div className="bg-raisinBlack rounded-lg shadow-xl p-14 flex flex-col justify-center items-center gap-8">
            <h3 className="text-3xl text-center font-bold text-white mb-8">
              {currentQuestion.value}
            </h3>

            {/* Alternativas */}
            <div className="grid grid-cols-2 grid-rows-2 gap-4 w-[660px]">
              {answersArray.map((answer, index) => {
                const cutClass =
                  index === 0 ? 'cut-right-bottom' :
                    index === 1 ? 'cut-left-bottom' :
                      index === 2 ? 'cut-right-top' :
                        'cut-left-top';

                return (
                  <button
                    key={answer.id}
                    onClick={() => handleSelectAnswer(answer.id)}
                    disabled={isAnswerSubmitted}
                    className={`font-semibold w-[322px] h-[165px] text-[30px] text-center p-4 transition-all duration-500 rounded-[10px]  ${getAnswerStyle(answer)} answer-button
        ${cutClass}
        ${isAnswerSubmitted ? 'cursor-not-allowed' : ''}
      `}
                  >
                    <div className="flex items-center justify-center">
                      <span className="flex-1">{answer.value}</span>
                      {isAnswerSubmitted && answer.id === selectedAnswer && (
                        pointsEarned > 0 ? (
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )
                      )}
                    </div>
                  </button>
                );
              })}

            </div>

            {/* Mensagem de feedback */}
            {isAnswerSubmitted && (
              <div className={`text-2xl font-bold ${pointsEarned > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pointsEarned > 0 ? 'Correto!' : 'Incorreto!'}
              </div>
            )}
          </div>
        </div>
      </main>


    </div>
  );
}

export default PlayQuiz;