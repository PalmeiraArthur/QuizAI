// src/pages/playQuiz.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import scoreService from '../services/scoreService';
import questionService from '../services/questionService';
// quizService and roomService removed from this page; scoring handled via scoreService and websocket
import webSocketService from '../services/websocketService';
import Navbar from '../components/navbar';
import clickSound from '../assets/sounds/click.mp3'
import playSound from '../services/soundService';
import Timer from '../components/Timer';


function PlayQuiz() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const roomIdQuery = searchParams.get('roomId');
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [scoreId, setScoreId] = useState(null);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isHost, setIsHost] = useState(false);
  // use centralized sound player
  const [showPreQuizTimer, setShowPreQuizTimer] = useState(true);
  const [preQuizTimeLeft, setPreQuizTimeLeft] = useState(5); // Tempo inicial para o timer de pré-quiz
  const [questionTimeLeft, setQuestionTimeLeft] = useState(0);
  const [questionTimeLimit, setQuestionTimeLimit] = useState(30); // tempo limite padrão

  const isTransitioningRef = useRef(false); // Ref para controlar se uma transição de questão está em andamento


  useEffect(() => {
    const initializeGame = async () => {
      const savedQuiz = localStorage.getItem(`quiz_${id}`);
      const storedIsHost = localStorage.getItem('isHost') === 'true';
      setIsHost(storedIsHost);

      if (!savedQuiz) {
        alert('Quiz não encontrado!');
        navigate('/');
        return;
      }

      const quizData = JSON.parse(savedQuiz);
      const questionsArray = Array.from(quizData.questions);
      setQuiz({ ...quizData, questions: questionsArray });

      // O scoreId já foi criado quando o usuário entrou na sala
      // Ele está armazenado em localStorage após joinRoom ou createRoom
      const storedScoreId = localStorage.getItem('scoreId');
      if (storedScoreId) {
        setScoreId(storedScoreId);
        console.log('Score ID carregado do localStorage:', storedScoreId);
      } else {
        console.warn('ScoreId não encontrado no localStorage. Jogo seguirá sem scoreboard (fallback local).');
      }
      
      // Log roomId info
      const effectiveRoomId = roomIdQuery || localStorage.getItem('currentRoomId');
      console.log('[PLAYQUIZ] Initialized. RoomID:', effectiveRoomId, 'RoomIdQuery:', roomIdQuery);
    };

    initializeGame();
  }, [id, navigate, roomIdQuery]);

  const handlePreQuizTimerComplete = useCallback(async () => {
    setShowPreQuizTimer(false);
    if (isHost && roomIdQuery) {
      try {
        await webSocketService.connect();
        webSocketService.sendStartMatch(roomIdQuery);
        console.log("Host enviou sendStartMatch para roomId:", roomIdQuery);
      } catch (error) {
        console.error("Erro ao enviar sendStartMatch como host:", error);
      }
    }
  }, [isHost, roomIdQuery]);

  // Pre-quiz timer countdown
  useEffect(() => {
    if (!showPreQuizTimer) return;

    if (preQuizTimeLeft <= 0) {
      handlePreQuizTimerComplete();
      return;
    }

    const timerId = setInterval(() => {
      setPreQuizTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [showPreQuizTimer, preQuizTimeLeft, isHost, roomIdQuery, handlePreQuizTimerComplete]);

  // WebSocket: connect and subscribe to room scoreboard updates, joins and exits
  useEffect(() => {
    const setupWebsocket = async () => {
      const roomId = roomIdQuery || localStorage.getItem('currentRoomId');
      if (!roomId) return;

      try {
        await webSocketService.connect();

        webSocketService.subscribeToScoreUpdates(roomId, (update) => {
          // update => { scoreId, player, pointsEarned }
          setScore(prev => prev + (update.pointsEarned || 0));
        });

        webSocketService.subscribeToPlayerJoins(roomId, () => {
          // Player join event
        });

        webSocketService.subscribeToPlayerExits(roomId, () => {
          // Player exit event
        });

      } catch (err) {
        console.warn('Falha ao conectar/inscrever websocket em PlayQuiz', err);
      }
    };

    setupWebsocket();

    return () => {
      const roomId = roomIdQuery || localStorage.getItem('currentRoomId');
      if (roomId) webSocketService.cleanupSubscriptions(roomId);
    };
  }, [roomIdQuery]);

  const handleSelectAnswer = async (answerId) => {
    if (isAnswerSubmitted) return;

    // 🔊 tocar som de clique via soundService
    try {
      playSound(clickSound, { volume: 0.6 });
    } catch (e) { console.warn('Erro ao tentar tocar som', e); }

    setIsAnswerSubmitted(true);
    setSelectedAnswer(answerId);

    const userId = localStorage.getItem('userId');
    const questionId = quiz.questions[currentQuestionIndex].id;

    try {
      let result;
      // preferir calcular via backend usando scoreboard
      if (scoreId) {
        const effectiveRoomId = roomIdQuery || localStorage.getItem('currentRoomId');
        result = await scoreService.calculateAnswerScore(
          scoreId,
          userId,
          answerId,
          effectiveRoomId
        );
      } else {
        // fallback: buscar resposta correta e computar pontos localmente
        const correctId = await questionService.getCorrectAnswer(questionId);
        const points = correctId === answerId ? 10 : 0; // fallback points
        result = { pointsEarned: points };
      }

      const points = result.pointsEarned || 0;

      // Notify other players via websocket so backend can broadcast updated scoreboard
      try {
        const effectiveRoomId = roomIdQuery || localStorage.getItem('currentRoomId');
        if (scoreId && effectiveRoomId) {
          await webSocketService.connect();
          webSocketService.sendPlayerScore(effectiveRoomId, scoreId, points);
        }
      } catch (wsErr) {
        console.warn('Falha ao notificar pontuação via websocket:', wsErr);
      }

      // Se errou, buscar a resposta correta (se ainda não obtivemos)
      if (points === 0 && !correctAnswer) {
        try {
          const correctId = await questionService.getCorrectAnswer(questionId);
          setCorrectAnswer(correctId);
        } catch (error) {
          console.error('Erro ao buscar resposta correta:', error);
        }
      }

      // Mostrar animação de pontos
      setPointsEarned(points);
      setShowPointsAnimation(true);

      // Somar pontos ao total
      setScore(prevScore => prevScore + points);

      setAnsweredQuestions(prev => [...prev, {
        questionId,
        answerId,
        pointsEarned: points
      }]);

      // Aumentei para 3 segundos para dar tempo de ver as cores
      setTimeout(() => {
        setShowPointsAnimation(false);
        handleNextQuestion();
      }, 3000);

    } catch (err) {
      console.error('Erro ao calcular pontuação:', err);
      alert('Erro ao enviar resposta. Tente novamente.');
      setIsAnswerSubmitted(false);
      setSelectedAnswer(null);
    }
  };

  const handleNextQuestion = useCallback(() => {
    if (!quiz || isTransitioningRef.current) {
      console.warn('[handleNextQuestion] Quiz is null or already transitioning. Cannot advance question.');
      return;
    }

    isTransitioningRef.current = true; // Inicia a transição

    setCurrentQuestionIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      if (nextIndex < quiz.questions.length) {
        setSelectedAnswer(null);
        setCorrectAnswer(null);
        setIsAnswerSubmitted(false);
        isTransitioningRef.current = false; // Finaliza a transição após o state update
        return nextIndex;
      } else {
        setShowResults(true);
        isTransitioningRef.current = false; // Finaliza a transição (quiz completo)
        return prevIndex; // Não muda o index se o quiz terminou
      }
    });
  }, [quiz, setShowResults]); // Inclui quiz como dependência

  // Handle question timeout - automatically advance to next question without giving points
  const handleQuestionTimeout = useCallback(() => {
    if (isAnswerSubmitted || isTransitioningRef.current) return; // Só avança se não respondeu e NÃO estiver em transição

    setIsAnswerSubmitted(true);
    setSelectedAnswer(null);
    setCorrectAnswer(null);
    handleNextQuestion();
  }, [isAnswerSubmitted, handleNextQuestion]);

  // Initialize timer when a new question is displayed
  useEffect(() => {
    if (showPreQuizTimer || !quiz) return;

    // Set initial timer values when question changes
    const newInitialTime = 30; // Default 30 seconds, can be adjusted based on quiz config
    setQuestionTimeLimit(newInitialTime);
    setQuestionTimeLeft(newInitialTime);
    setIsAnswerSubmitted(false); // Reset answered state for new question
  }, [currentQuestionIndex, showPreQuizTimer, quiz]);

  // WebSocket: connect and subscribe to question countdown updates
  useEffect(() => {
    if (showPreQuizTimer) {
      setQuestionTimeLeft(0);
      setQuestionTimeLimit(30);
      return;
    }

    const setupQuestionTimer = async () => {
      const roomId = roomIdQuery || localStorage.getItem('currentRoomId');
      
      if (!roomId) {
        return;
      }

      try {
        await webSocketService.connect();
        
        webSocketService.subscribeToQuestionCountdown(roomId, (timeData) => {
          const timeRemaining = timeData.timeRemainingInSeconds ?? 0;
          const totalTime = timeData.totalTimeInSeconds ?? 30;
          
          setQuestionTimeLeft(timeRemaining);
          setQuestionTimeLimit(totalTime);
          
          // Se o tempo chegou a 0 e o usuário não respondeu, avançar para próxima questão
          if (timeRemaining <= 0 && !isAnswerSubmitted) {
            handleQuestionTimeout();
          }
        });
      } catch (err) {
        console.warn('[TIMER] Falha ao conectar websocket:', err);
      }
    };

    setupQuestionTimer();

    return () => {
      // Cleanup if needed
    };
  }, [showPreQuizTimer, roomIdQuery, isAnswerSubmitted, handleQuestionTimeout]);

  // Fallback: Local timer countdown when no backend updates
  useEffect(() => {
    if (showPreQuizTimer || questionTimeLeft <= 0 || isAnswerSubmitted) return;

    const localTimerId = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          if (!isAnswerSubmitted) {
            handleQuestionTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(localTimerId);
    };
  }, [showPreQuizTimer, isAnswerSubmitted, questionTimeLeft, handleQuestionTimeout]);

  // Renomeando de handlePlayAgain para handleFinishAndCleanup
  const handleFinishAndCleanup = async () => {
    try {
      setLoading(true);

      // Não deletamos o quiz do localStorage para permitir replay
      // const currentRoomId = roomIdQuery || localStorage.getItem('currentRoomId');

      // Clean up only quiz-specific UI state (mantemos o quiz salvo)
      // if (id) {
      //   localStorage.removeItem(`quiz_${id}`);
      // }

      // Reset local UI state
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setCorrectAnswer(null);
      setShowResults(false);
      setAnsweredQuestions([]);
      setIsAnswerSubmitted(false);

      // Navegar para a página do quiz para permitir jogar novamente
      if (id) {
        navigate(`/quiz/${id}`);
      } else {
        navigate('/');
      }

    } catch (err) {
      console.error('❌ Erro durante cleanup:', err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Função para determinar a cor da alternativa
  const getAnswerStyle = (answer) => {
    if (!isAnswerSubmitted) {
      // Antes de responder - estado normal
      return 'bg-silver hover:border-plumpPurple text-raisinBlack hover:scale-102 cursor-pointer';
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

    // ✅ Mostrar a resposta correta em verde quando errar
    if (correctAnswer && answer.id === correctAnswer) {
      return 'bg-green-500 border-green-600 text-white';
    }

    // Outras alternativas ficam normais
    return 'bg-silver text-raisinBlack opacity-50';
  };

  if (showPreQuizTimer) {
    return (
      <div className="min-h-screen bg-darkGunmetal flex flex-col items-center justify-center text-center p-10">
        <h2 className="text-white text-3xl font-bold mb-8">Preparado? O quiz vai começar!</h2>
        <Timer
          initialTime={5}
          currentTime={preQuizTimeLeft}
          size="lg"
          progressColor="#4CAF50"
          onComplete={handlePreQuizTimerComplete}
        />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-darkGunmetal flex items-center justify-center">
        <div className="text-white text-xl">Carregando quiz...</div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  
  // Guard against undefined currentQuestion (e.g., when quiz ends)
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-darkGunmetal flex items-center justify-center">
        <div className="text-white text-xl">Finalizando...</div>
      </div>
    );
  }

  const answersArray = Array.from(currentQuestion.answers);
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  if (showResults) {
    return (
      <div className="min-h-screen bg-darkGunmetal flex justify-center w-[1140px]">
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
                      onClick={handleFinishAndCleanup}
                      disabled={loading}
                      className="flex-1 bg-pistachio text-raisinBlack font-bold py-3 px-6 rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Finalizar e Voltar
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
      <main className="container mx-auto mt-[100px] md:mt-[60px]">
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
              <div className="text-right relative flex items-center gap-6">
                {/* Timer da questão */}
                <div className="flex flex-col items-center">
                    <Timer
                    initialTime={questionTimeLimit}
                    currentTime={questionTimeLeft}
                    size="sm"
                    strokeWidth={6}
                    circleColor="#3a3a3a"
                    progressColor={questionTimeLeft <= 5 ? '#ef4444' : '#4CAF50'}
                    textColor="#ffffff"
                    onComplete={handleQuestionTimeout}
                  />
                  <span className="text-gray-400 text-xs mt-2">Tempo: {questionTimeLeft}s</span>
                </div>

                <div>
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

                // Determina o tamanho da fonte baseado no comprimento do texto e palavras
                const getFontSize = (text) => {
                  const length = text.length;
                  const words = text.split(/\s+/).length;
                  
                  if (length > 300 || words > 30) return 'text-[10px]'; 
                  // Textos extremamente longos
                  if (length > 300 || words > 25) return 'text-sm'; // 14px
                  
                  // Textos muito longos
                  if (length > 200 || words > 20) return 'text-base'; // 16px
                  
                  // Textos longos
                  if (length > 150 || words > 14) return 'text-lg'; // 18px
                  
                  // Textos médios-longos
                  if (length > 100 || words > 10) return 'text-xl'; // 20px
                  
                  // Textos médios
                  if (length > 50 || words > 8) return 'text-2xl'; // 24px
                  
                  // Textos curtos (padrão)
                  return 'text-[30px]';
                };

                // ✅ Verificar se é a resposta correta
                const isCorrectAnswer = correctAnswer && answer.id === correctAnswer;
                const isSelectedAnswer = answer.id === selectedAnswer;

                return (
                  <button
                    key={answer.id}
                    onClick={() => handleSelectAnswer(answer.id)}
                    disabled={isAnswerSubmitted}
                    className={`font-semibold w-[322px] h-[165px] ${getFontSize(answer.value)} text-center p-4 transition-all duration-500 rounded-[10px] ${getAnswerStyle(answer)} answer-button 
                      ${cutClass}
                      ${isAnswerSubmitted ? 'cursor-not-allowed' : ''}`
                    }
                  >
                    <div className="flex items-center justify-center">
                      <span className="flex-1 break-words">{answer.value}</span>
                      {isAnswerSubmitted && (
                        <>
                          {/* Selecionada e correta */}
                          {isSelectedAnswer && pointsEarned > 0 && (
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          {/* Selecionada e errada */}
                          {isSelectedAnswer && pointsEarned === 0 && (
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          {/* Resposta correta (quando errou) */}
                          {isCorrectAnswer && !isSelectedAnswer && (
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </>
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