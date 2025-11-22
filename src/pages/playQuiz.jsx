// src/pages/playQuiz.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import scoreService from '../services/scoreService';
import questionService from '../services/questionService';
// quizService and roomService removed from this page; scoring handled via scoreService and websocket
import webSocketService from '../services/websocketService';
import Navbar from '../components/navbar';
import clickSound from '../assets/sounds/click.mp3'


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

      // O scoreId já foi criado quando o usuário entrou na sala
      // Ele está armazenado em localStorage após joinRoom ou createRoom
      const storedScoreId = localStorage.getItem('scoreId');
      if (storedScoreId) {
        setScoreId(storedScoreId);
        console.log('Score ID carregado do localStorage:', storedScoreId);
      } else {
        console.warn('ScoreId não encontrado no localStorage. Jogo seguirá sem scoreboard (fallback local).');
      }
    };

    initializeGame();
  }, [id, navigate]);


  // WebSocket: connect and subscribe to room scoreboard updates, joins and exits
  useEffect(() => {
    const setupWebsocket = async () => {
      const roomId = roomIdQuery || localStorage.getItem('currentRoomId');
      if (!roomId) return;

      // inicializar scoreboard a partir do localStorage
      const roomStr = localStorage.getItem(`room_${roomId}`);
      if (roomStr) {
        try {
          const roomObj = JSON.parse(roomStr);
          setScoreboardState(roomObj.scoreboard || []);
        } catch (err) {
          console.warn('Falha ao parsear room do localStorage para scoreboard', err);
        }
      }

      try {
        await webSocketService.connect();


        webSocketService.subscribeToScoreUpdates(roomId, (update) => {
          // update => { scoreId, player, pointsEarned }
          console.log('[WS] Score update recebido:', update);
          setScore(prev => prev + (update.pointsEarned || 0));

          const updateId = update.scoreId || update.id;

          // Atualizar scoreboard local
          setScoreboardState((prev) => {
            const exists = prev.some(s => s.id === updateId);
            let next;
            if (exists) {
              next = prev.map(s => s.id === updateId ? { ...s, score: (s.score || 0) + (update.pointsEarned || 0) } : s);
            } else {
              next = [...prev, { id: updateId, score: update.pointsEarned || 0, player: update.player }];
            }

            // persist
            const room = JSON.parse(localStorage.getItem(`room_${roomId}`) || '{}');
            if (room && room.id) {
              room.scoreboard = next;
              localStorage.setItem(`room_${roomId}`, JSON.stringify(room));
            }

            return next;
          });
        });

        webSocketService.subscribeToPlayerJoins(roomId, (join) => {
          console.log('[WS] Player joined during game:', join);
          setScoreboardState(prev => {
            if (prev.some(s => s.id === (join.scoreId || join.id))) return prev;
            const normalized = { id: join.scoreId || join.id, score: join.score || 0, player: join.player };
            const next = [...prev, normalized];
            const room = JSON.parse(localStorage.getItem(`room_${roomId}`) || '{}');
            if (room && room.id) { room.scoreboard = next; localStorage.setItem(`room_${roomId}`, JSON.stringify(room)); }
            return next;
          });
        });

        webSocketService.subscribeToPlayerExits(roomId, (exit) => {
          console.log('[WS] Player exit during game:', exit);
          setScoreboardState(prev => {
            const idToRemove = exit.scoreId || exit.id;
            const next = prev.filter(s => s.id !== idToRemove);
            const room = JSON.parse(localStorage.getItem(`room_${roomId}`) || '{}');
            if (room && room.id) { room.scoreboard = next; localStorage.setItem(`room_${roomId}`, JSON.stringify(room)); }
            return next;
          });
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

  // local scoreboard state
  const [scoreboardState, setScoreboardState] = useState([]);

  const handleSelectAnswer = async (answerId) => {
    if (isAnswerSubmitted) return;

    // 🔊 tocar som de clique
    try {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play().catch((e) => { console.warn('Falha ao reproduzir som de clique', e); });
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
        const points = correctId === answerId ? 100 : 0; // fallback points
        result = { pointsEarned: points };
      }

      const points = result.pointsEarned || 0;
      console.log('Pontos ganhos nesta rodada:', points);

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
          console.log('Resposta correta:', correctId);
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

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setCorrectAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      setShowResults(true);
    }
  };

  // Renomeando de handlePlayAgain para handleFinishAndCleanup
  const handleFinishAndCleanup = async () => {
    try {
      setLoading(true);

      // We don't delete the room or the player's score here. Instead we
      // return the user to the lobby so they can review the scoreboard.
      const currentRoomId = roomIdQuery || localStorage.getItem('currentRoomId');

      // Clean up only quiz-specific local data
      if (id) {
        localStorage.removeItem(`quiz_${id}`);
      }

      // Reset local UI state
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setCorrectAnswer(null);
      setShowResults(false);
      setAnsweredQuestions([]);
      setIsAnswerSubmitted(false);

      // Navigate back to the room lobby if available
      if (currentRoomId) {
        navigate(`/sala/${currentRoomId}`);
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

          {/* Live scoreboard */}
          <aside className="ml-6 w-64">
            <div className="bg-darkGunmetal rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Scoreboard</h4>
              {scoreboardState.length === 0 ? (
                <p className="text-gray-400">Nenhum jogador ativo</p>
              ) : (
                <ol className="space-y-2">
                  {[...scoreboardState].sort((a,b)=> (b.score||0)-(a.score||0)).map((p) => (
                    <li key={p.id} className="flex justify-between text-white text-sm">
                      <span>{p.player?.username || 'Jogador'}</span>
                      <span className="text-pistachio font-bold">{p.score || 0}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </aside>

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