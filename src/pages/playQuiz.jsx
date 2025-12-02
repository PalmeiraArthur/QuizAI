// src/pages/playQuiz.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

// IMPORTANTE: Trocamos scoreService e questionService (para respostas) pelo answerService
import answerService from '../services/answerService'; 
import webSocketService from '../services/websocketService';
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
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isHost, setIsHost] = useState(false);

  const [showPreQuizTimer, setShowPreQuizTimer] = useState(true);
  const [preQuizTimeLeft, setPreQuizTimeLeft] = useState(5);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(0);
  const [questionTimeLimit, setQuestionTimeLimit] = useState(30);
  const [hasReceivedQuestion, setHasReceivedQuestion] = useState(false);
  const [lastReceivedQuestionId, setLastReceivedQuestionId] = useState(null);

  // Novo estado para controlar o número da questão exibida
  const [questionNumber, setQuestionNumber] = useState(1);

  const isTransitioningRef = useRef(false);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);

  // keep ref in sync with state to read latest value inside callbacks
  useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex }, [currentQuestionIndex]);

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
      // Normaliza formato das questões retornadas pelo backend (questionId/description)
      const questionsArray = Array.from(quizData.questions || []).map(q => ({
        id: q.questionId ?? q.id,
        value: q.description ?? q.value ?? '',
        answers: Array.from(q.answers || []).map(a => ({
          answerId: a.answerId ?? a.id,
          description: a.description ?? a.value ?? ''
        }))
      }));

      setQuiz({ id: quizData.id, topic: quizData.topic, questions: questionsArray });

      // Se existe uma questão recebida recentemente (salva pela sala antes da navegação), aplica-a
      try {
        const lastQuestionRaw = localStorage.getItem(`lastQuestion_${quizData.id}`);
        if (lastQuestionRaw) {
          const lastQuestion = JSON.parse(lastQuestionRaw);
          const qId = lastQuestion?.questionId || lastQuestion?.id;
          // Normaliza e aplica a questão ao quiz (se corresponder a uma existente)
          setQuiz(prev => {
            if (!prev) return prev;
            const questions = Array.from(prev.questions || []);
            const idx = questions.findIndex(q => String(q.id) === String(qId));
            const mapped = {
              id: qId,
              value: lastQuestion.description ?? lastQuestion.value ?? '',
              answers: Array.from(lastQuestion.answers || []).map(a => ({ answerId: a.answerId ?? a.id, description: a.description ?? a.value ?? '' }))
            };
            if (idx >= 0) {
              questions[idx] = { ...questions[idx], ...mapped };
              // define o índice atual para a questão recebida
              setCurrentQuestionIndex(idx);
              setQuestionNumber(idx + 1);
            }
            // remove o lastQuestion do storage para evitar reaplicação
            try { localStorage.removeItem(`lastQuestion_${quizData.id}`); } catch(e) {}
            return { ...prev, questions };
          });
        }
      } catch (e) { console.warn('Erro aplicando lastQuestion:', e); }

      const storedScoreId = localStorage.getItem('scoreId');
      if (storedScoreId) {
        setScoreId(storedScoreId);
      } else {
        // Se o quiz salvo contiver um scoreId (ex: jogador já iniciou partida), use-o
        if (quizData.scoreId) {
          setScoreId(quizData.scoreId);
          localStorage.setItem('scoreId', quizData.scoreId);
        } else {
          console.warn('ScoreId não encontrado no localStorage.');
        }
      }

      // Se houver um start-match-countdown salvo (chegou na sala antes da navegação), aplica-o
      try {
        const roomId = roomIdQuery || localStorage.getItem('currentRoomId');
        if (roomId) {
          const savedCountdown = localStorage.getItem(`startMatchCountdown_${roomId}`);
          if (savedCountdown) {
            try {
              const countdownData = JSON.parse(savedCountdown);
              const rem = countdownData?.timeRemainingInSeconds ?? 0;
              setShowPreQuizTimer(rem > 0);
              setPreQuizTimeLeft(rem > 0 ? rem : 0);
            } catch (e) {
              console.warn('Erro parseando startMatchCountdown salvo', e);
            }
            try { localStorage.removeItem(`startMatchCountdown_${roomId}`); } catch(e) {}
          }
        }
      } catch (e) { console.warn('Erro aplicando startMatchCountdown salvo:', e); }

        // Se houver um question-countdown salvo (chegou antes da montagem), aplica-o como fallback visual
        try {
          const roomId = roomIdQuery || localStorage.getItem('currentRoomId');
          if (roomId) {
            const savedQCountdown = localStorage.getItem(`questionCountdown_${roomId}`);
            if (savedQCountdown) {
              try {
                const qcd = JSON.parse(savedQCountdown);
                const remQ = qcd?.timeRemainingInSeconds ?? 0;
                if (remQ > 0) setQuestionTimeLeft(remQ);
              } catch (e) { console.warn('Erro parseando questionCountdown salvo', e); }
              try { localStorage.removeItem(`questionCountdown_${roomId}`); } catch(e) {}
            }
          }
        } catch (e) { console.warn('Erro aplicando questionCountdown salvo:', e); }
    };

    initializeGame();
  }, [id, navigate, roomIdQuery]);

  // ... (Hooks de Timer e WebSocket permanecem iguais até a função handleSelectAnswer) ...

  const handlePreQuizTimerComplete = useCallback(async () => {
    setShowPreQuizTimer(false);
    if (isHost && roomIdQuery) {
      try {
        await webSocketService.connect();
        const playerId = localStorage.getItem('userId');
        webSocketService.sendStartMatch(roomIdQuery, playerId);
      } catch (error) {
        console.error("Erro ao enviar sendStartMatch:", error);
      }
    }
  }, [isHost, roomIdQuery]);

  // Timer Pre-Quiz
  useEffect(() => {
    if (!showPreQuizTimer) return;
    if (preQuizTimeLeft <= 0) {
      handlePreQuizTimerComplete();
      return;
    }
    const timerId = setInterval(() => setPreQuizTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [showPreQuizTimer, preQuizTimeLeft, handlePreQuizTimerComplete]);

  // WebSocket Setup
  useEffect(() => {
    const setupWebsocket = async () => {
      const roomId = roomIdQuery || localStorage.getItem('currentRoomId');
      if (!roomId) return;

      try {
        await webSocketService.connect();
        webSocketService.subscribeToScoreUpdates(roomId, (update) => {
          setScore(prev => prev + (update.pointsEarned || 0));
        });
        // Assinar contagem regressiva para início da partida
        webSocketService.subscribeToStartMatchCountdown(roomId, (countdown) => {
          try {
            const rem = countdown?.timeRemainingInSeconds ?? 0;
            setShowPreQuizTimer(rem > 0);
            setPreQuizTimeLeft(rem);
            if (rem <= 0) setShowPreQuizTimer(false);
          } catch (e) {
            console.warn('Erro processando start match countdown', e);
          }
        });

        // Assinar questões enviadas pelo servidor

        webSocketService.subscribeToQuestion(roomId, (questionData) => {
          try {
            console.log('[PlayQuiz WS] 📨 question received:', questionData);
            // Atualiza questionTime e conteúdo da questão conforme enviado pelo backend
            const qId = questionData?.questionId || questionData?.id;
            const totalTime = questionData?.totalTimeInSeconds ?? questionTimeLimit;

            // Marca que recebemos uma questão do servidor e guarda o id (autoridade)
            setHasReceivedQuestion(true);
            setLastReceivedQuestionId(qId);
            setQuestionTimeLimit(totalTime);
            setQuestionTimeLeft(totalTime);

            // Atualiza o quiz local (substitui a questão correspondente se existir)
            // e, de forma determinística, atualiza o índice atual usando o estado anterior
            setQuiz(prev => {
              if (!prev) return prev;
              const questions = Array.from(prev.questions || []);
              const idx = questions.findIndex(q => String(q.id) === String(qId));
              if (idx >= 0) {
                questions[idx] = {
                  ...questions[idx],
                  value: questionData.description ?? questions[idx].value,
                  answers: questionData.answers ?? questions[idx].answers,
                };
                // Atualiza o índice de questão usando o resultado da busca (evita closures com estado stale)
                setCurrentQuestionIndex(idx);
                currentQuestionIndexRef.current = idx;
                // Define o número da questão exibida com base no índice recebido
                setQuestionNumber(idx + 1);
                console.log('[PlayQuiz] aplicado questionId -> index', { qId, idx });
                return { ...prev, questions };
              }
              // Se a questão não estiver no quiz local, apenas tenta anexá-la ao final (defensivo)
              console.warn('[PlayQuiz] questionId não encontrado no quiz local, adicionando temporariamente', qId);
              const mapped = {
                id: qId,
                value: questionData.description ?? '',
                answers: questionData.answers ?? []
              };
              const newQuestions = [...questions, mapped];
              const newIdx = newQuestions.length - 1;
              setCurrentQuestionIndex(newIdx);
              currentQuestionIndexRef.current = newIdx;
              setQuestionNumber(newIdx + 1);
              return { ...prev, questions: newQuestions };
            });

            setSelectedAnswer(null);
            setIsAnswerSubmitted(false);
            setCorrectAnswer(null);
          } catch (e) {
            console.warn('Erro processando questão WS', e);
          }
        });

        // Assinar contagem regressiva por questão
        webSocketService.subscribeToQuestionCountdown(roomId, (timeData) => {
          try {
            console.log('[PlayQuiz WS] ⏱ question-countdown received:', timeData);
            const rem = timeData?.timeRemainingInSeconds ?? 0;
            setQuestionTimeLeft(rem);
            setQuestionTimeLimit(timeData?.totalTimeInSeconds ?? questionTimeLimit);
            if (rem <= 0 && !isAnswerSubmitted) handleQuestionTimeout();
          } catch (e) {
            console.warn('Erro processando question countdown', e);
          }
        });
      } catch (err) {
        console.warn('Falha websocket PlayQuiz', err);
      }
    };
    setupWebsocket();
    return () => {
        const roomId = roomIdQuery || localStorage.getItem('currentRoomId');
        if (roomId) webSocketService.cleanupRoomSubscriptions(roomId);
    };
  }, [roomIdQuery]);

  // ----------------------------------------------------------------------
  // LÓGICA DE RESPOSTA ATUALIZADA
  // ----------------------------------------------------------------------
  const handleSelectAnswer = async (answerId) => {
    if (isAnswerSubmitted) return;

    try {
      playSound(clickSound, { volume: 0.6 });
    } catch (e) { console.warn('Erro som', e); }

    // Só permite submeter resposta se a questão atual foi enviada pelo servidor
    const currentQuestionLocal = quiz?.questions?.[currentQuestionIndex];
    const questionIdLocal = currentQuestionLocal?.id;
    if (!hasReceivedQuestion || !lastReceivedQuestionId || String(questionIdLocal) !== String(lastReceivedQuestionId)) {
      console.warn('Tentativa de responder questão local que não foi liberada pelo servidor', { questionIdLocal, lastReceivedQuestionId, hasReceivedQuestion, currentQuestionIndex: currentQuestionIndexRef.current });
      alert('Aguardando a questão enviada pelo servidor. Por favor espere alguns instantes.');
      return;
    }

    setIsAnswerSubmitted(true);
    setSelectedAnswer(answerId);

    const playerId = localStorage.getItem('userId'); // No backend é esperado como playerId
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const questionId = currentQuestion.id;
    const effectiveRoomId = roomIdQuery || localStorage.getItem('currentRoomId');
    // Validações mínimas antes de chamar o serviço
    if (!playerId || !effectiveRoomId || !scoreId) {
      console.error('Dados ausentes ao tentar enviar resposta', { playerId, effectiveRoomId, scoreId });
      alert('Não foi possível enviar a resposta — dados da sessão incompletos.');
      setIsAnswerSubmitted(false);
      setSelectedAnswer(null);
      return;
    }

    try {
      // Chamada unificada ao AnswerController
      const response = await answerService.processPlayerAnswer({
        playerId,
        answerId,
        roomId: effectiveRoomId,
        questionId,
        scoreId
      });

      // API retorna { pointsEarned, correctAnswerId, playerAnswerId }
      const { pointsEarned = 0, correctAnswerId, playerAnswerId } = response || {};

      // Atualiza estado com o resultado do backend
      setPointsEarned(pointsEarned);
      setCorrectAnswer(correctAnswerId); // Backend já devolve qual era a correta
      setLastAnswerCorrect(Boolean(playerAnswerId === correctAnswerId || pointsEarned > 0));
      
      // Animação e Score Local
      setShowPointsAnimation(true);
      setScore(prevScore => prevScore + (pointsEarned || 0));

      // Envia Score via WebSocket para atualizar placar dos outros
      if (effectiveRoomId && scoreId) {
        try {
          await webSocketService.connect();
          webSocketService.sendPlayerScore(effectiveRoomId, scoreId, pointsEarned || 0);
        } catch (wsErr) {
            console.warn('WS Score Error', wsErr);
        }
      }

      setAnsweredQuestions(prev => [...prev, {
        questionId,
        answerId: playerAnswerId ?? answerId,
        pointsEarned: pointsEarned || 0,
        correctAnswerId,
        isCorrect: Boolean(playerAnswerId === correctAnswerId || pointsEarned > 0)
      }] );

      setTimeout(() => {
        setShowPointsAnimation(false);
        // Em partidas por sala, o próximo avanço deve ser controlado pelo servidor
        const effectiveRoomId = roomIdQuery || localStorage.getItem('currentRoomId');
        if (!effectiveRoomId) {
          handleNextQuestion();
        } else {
          // apenas limpa a animação e aguarda o servidor enviar a próxima questão
          console.log('[PlayQuiz] aguardando próxima questão do servidor (multiplayer)', { currentQuestionIndex: currentQuestionIndexRef.current, lastReceivedQuestionId });
        }
      }, 3000);

    } catch (err) {
      console.error('Erro ao processar resposta:', err);
      alert('Erro ao enviar resposta.');
      setIsAnswerSubmitted(false);
      setSelectedAnswer(null);
    }
  };

  const handleNextQuestion = useCallback(() => {
    if (!quiz || isTransitioningRef.current) {
      console.log('[PlayQuiz] handleNextQuestion blocked', { hasQuiz: !!quiz, isTransitioning: isTransitioningRef.current });
      return;
    }
    isTransitioningRef.current = true;

    setCurrentQuestionIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      console.log('[PlayQuiz] avançando localmente de índice', { prevIndex, nextIndex, total: quiz.questions.length });
      if (nextIndex < quiz.questions.length) {
        setSelectedAnswer(null);
        setCorrectAnswer(null);
        setIsAnswerSubmitted(false);
        isTransitioningRef.current = false;
        currentQuestionIndexRef.current = nextIndex;
        setQuestionNumber(nextIndex + 1);
        return nextIndex;
      } else {
        setShowResults(true);
        isTransitioningRef.current = false;
        return prevIndex;
      }
    });
  }, [quiz]);

  const handleQuestionTimeout = useCallback(() => {
    if (isAnswerSubmitted || isTransitioningRef.current) {
      console.log('[PlayQuiz] handleQuestionTimeout blocked', { isAnswerSubmitted, isTransitioning: isTransitioningRef.current });
      return;
    }
    console.log('[PlayQuiz] question timeout — avançando');
    setIsAnswerSubmitted(true);
    setSelectedAnswer(null);
    setCorrectAnswer(null);
    handleNextQuestion();
  }, [isAnswerSubmitted, handleNextQuestion]);

  // Timers da Questão e Cleanup (Mantidos iguais ao original, resumidos aqui)
  useEffect(() => {
    // Não inicializa timers locais enquanto estivermos no pré-quiz
    // ou enquanto não tivermos recebido a primeira questão do backend.
    if (showPreQuizTimer || !quiz || !hasReceivedQuestion) return;
    setQuestionTimeLimit(30);
    setQuestionTimeLeft(30);
    setIsAnswerSubmitted(false);
  }, [currentQuestionIndex, showPreQuizTimer, quiz]);

  

  // Timer Local Fallback
  useEffect(() => {
    // Só executa timer local de fallback se já tivermos recebido a questão do backend
    if (showPreQuizTimer || !hasReceivedQuestion || questionTimeLeft <= 0 || isAnswerSubmitted) return;
    const localTimerId = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          if (!isAnswerSubmitted) handleQuestionTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(localTimerId);
  }, [showPreQuizTimer, isAnswerSubmitted, questionTimeLeft, handleQuestionTimeout]);


  const handleFinishAndCleanup = async () => {
    try {
      setLoading(true);
      setCurrentQuestionIndex(0);
      setQuestionNumber(1);
      setSelectedAnswer(null);
      setCorrectAnswer(null);
      setShowResults(false);
      setAnsweredQuestions([]);
      setIsAnswerSubmitted(false);
      if (id) navigate(`/quiz/${id}`);
      else navigate('/');
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const getAnswerStyle = (answer) => {
    if (!isAnswerSubmitted) return 'bg-silver hover:border-plumpPurple text-raisinBlack hover:scale-102 cursor-pointer';
    
    if (answer.answerId === selectedAnswer) {
      return pointsEarned > 0 
        ? 'bg-green-500 border-green-600 text-white scale-105' 
        : 'bg-red-500 border-red-600 text-white scale-105';
    }
    if (correctAnswer && answer.answerId === correctAnswer) {
      return 'bg-green-500 border-green-600 text-white';
    }
    return 'bg-silver text-raisinBlack opacity-50';
  };

  // ... (Blocos de Renderização JSX: TimerInicial, Loading, Results, MainGame) ...
  // O JSX permanece praticamente idêntico ao original, apenas certifique-se 
  // que o 'getAnswerStyle' está sendo chamado corretamente nos botões.

  if (showPreQuizTimer) {
     // ... renderiza timer inicial
     return (
        <div className="min-h-screen bg-darkGunmetal flex flex-col items-center justify-center text-center p-10">
            <h2 className="text-white text-3xl font-bold mb-8">Preparado? O quiz vai começar!</h2>
            <Timer initialTime={5} currentTime={preQuizTimeLeft} size="lg" progressColor="#4CAF50" onComplete={handlePreQuizTimerComplete} />
        </div>
     )
  }

  if (!quiz || !quiz.questions[currentQuestionIndex]) return <div className="min-h-screen bg-darkGunmetal flex items-center justify-center text-white">Carregando...</div>;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const answersArray = Array.from(currentQuestion.answers);
  // O progresso pode ser calculado pelo número da questão exibida
  const progress = ((questionNumber) / quiz.questions.length) * 100;

  if (showResults) {
    // ... renderiza tela de resultados (usar handleFinishAndCleanup no botão)
    return (
        <div className="min-h-screen bg-darkGunmetal flex justify-center w-[1140px]">
           {/* ... Seu JSX de resultado ... */}
             <div className="text-6xl font-bold text-pistachio mb-4">{score} pontos</div>
             <button onClick={handleFinishAndCleanup} className="bg-pistachio text-raisinBlack font-bold py-3 px-6 rounded-lg">Finalizar e Voltar</button>
           {/* ... */}
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-darkGunmetal flex justify-center w-[1140px]">
      <main className="container mx-auto mt-[100px] md:mt-[60px]">
        <div className="max-w-5xl mx-auto">
          {/* Header e Score */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
               <div>
                  <h2 className="text-white font-semibold text-[30px]">{quiz.topic}</h2>
                  <span className="text-gray-400">Questão {questionNumber} de {quiz.questions.length}</span>
               </div>
               <div className="text-right relative flex items-center gap-6">
                  {/* Timer da questão */}
                  <div className="flex flex-col items-center">
                    <Timer initialTime={questionTimeLimit} currentTime={questionTimeLeft} size="sm" strokeWidth={6} circleColor="#3a3a3a" progressColor={questionTimeLeft <= 5 ? '#ef4444' : '#4CAF50'} textColor="#ffffff" onComplete={handleQuestionTimeout} />
                  </div>
                  {/* Score e animação */}
                  <div>
                    <div className="text-pistachio font-bold text-[40px]">{score}</div>
                    {showPointsAnimation && (
                        <div className={`absolute -top-2 right-0 text-4xl font-bold animate-float ${pointsEarned > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pointsEarned > 0 ? `+${pointsEarned}` : '0'}
                        </div>
                    )}
                  </div>
               </div>
            </div>
            {/* Barra de progresso */}
            <div className="w-full bg-darkGunmetal rounded-full h-2">
                <div className="bg-pistachio h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Área da Pergunta */}
          <div className="bg-raisinBlack rounded-lg shadow-xl p-14 flex flex-col justify-center items-center gap-8">
            <h3 className="text-3xl text-center font-bold text-white mb-8">{currentQuestion.value}</h3>
            
            <div className="grid grid-cols-2 grid-rows-2 gap-4 w-[660px]">
              {answersArray.map((answer, index) => {
                 // Lógica de CSS (cut-right-bottom, etc) mantida
                 const cutClass = index === 0 ? 'cut-right-bottom' : index === 1 ? 'cut-left-bottom' : index === 2 ? 'cut-right-top' : 'cut-left-top';
                 const fontSize = answer.description.length > 50 ? 'text-xl' : 'text-[30px]'; // Simplificado para exemplo

                 return (
                   <button
                     key={answer.answerId}
                     onClick={() => handleSelectAnswer(answer.answerId)}
                     disabled={isAnswerSubmitted}
                     className={`font-semibold w-[322px] h-[165px] ${fontSize} text-center p-4 transition-all duration-500 rounded-[10px] ${getAnswerStyle(answer)} answer-button ${cutClass} ${isAnswerSubmitted ? 'cursor-not-allowed' : ''}`}
                   >
                     <div className="flex items-center justify-center">
                       <span className="flex-1 break-words">{answer.description}</span>
                     </div>
                   </button>
                 );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default PlayQuiz;