import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import roomService from '../services/roomService';
import webSocketService from '../services/websocketService';
import ToggleSwitch from '../components/toggleSwitch';
import { StepBack } from 'lucide-react';
import Scoreboard from '../components/scoreboard';

function Room() {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const [room, setRoom] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [currentScoreboard, setCurrentScoreboard] = useState([]);

  const userId = localStorage.getItem('userId');

  const handlePlayerJoin = useCallback((joinPayload) => {
    console.log('[JOIN WS] 📨 Payload recebido:', joinPayload);

    setCurrentScoreboard(prevScores => {
      const normalizedPayload = {
        id: joinPayload.scoreId || joinPayload.id,
        score: joinPayload.score || 0,
        player: joinPayload.player
      };

      const isAlreadyPresent = prevScores.some(score => score.id === normalizedPayload.id);

      if (!isAlreadyPresent) {
        console.log(`[JOIN WS] ✅ ${normalizedPayload.player?.username}`);
        const updatedScoreboard = [...prevScores, normalizedPayload];

        const roomData = JSON.parse(localStorage.getItem(`room_${roomId}`));
        if (roomData) {
          roomData.scoreboard = updatedScoreboard;
          localStorage.setItem(`room_${roomId}`, JSON.stringify(roomData));
        }

        return updatedScoreboard;
      }

      return prevScores;
    });
  }, [roomId]);

  const handlePlayerExit = useCallback((exitPayload) => {
    console.log('[EXIT WS] 📨 Jogador saindo:', exitPayload);

    setCurrentScoreboard(prevScores => {
      const scoreIdToRemove = exitPayload.scoreId || exitPayload.id;
      const updatedScoreboard = prevScores.filter(score => score.id !== scoreIdToRemove);

      const roomData = JSON.parse(localStorage.getItem(`room_${roomId}`));
      if (roomData) {
        roomData.scoreboard = updatedScoreboard;
        localStorage.setItem(`room_${roomId}`, JSON.stringify(roomData));
      }

      return updatedScoreboard;
    });
  }, [roomId]);

  // 🎮 NOVO: Handler para quando o jogo iniciar
  const handleGameStart = useCallback((gameStartPayload) => {
    console.log('[GAME START] 🎮 Jogo iniciando!', gameStartPayload);

    const quizId = gameStartPayload.quizId;

    // Navegar todos os players para o quiz
       navigate(`/jogar-quiz/${quizId}?roomId=${roomId}`);
  }, [navigate, roomId]);


  const handleScoreUpdate = useCallback((playerScoreResponse) => {
    console.log('[Score WS] recebido resposta do jogador');
  
    setCurrentScoreboard((prevScores) => {
      const { scoreId, pointsEarned } = playerScoreResponse;
  
      // 1. Atualiza o score do jogador específico
      const updated = prevScores.map((prevScore) => {
        if (String(prevScore.id) === String(scoreId)) {
          return {
            ...prevScore,
            score: (prevScore.score ?? 0) + (pointsEarned ?? 0),
          };
        }
        return prevScore;
      });
  
      // 2. Reordenar usando comparação de maior pontuação primeiro
      const reordered = [...updated].sort((a, b) => {
        const scoreA = a.score ?? 0;
        const scoreB = b.score ?? 0;
  
        // ordem decrescente
        if (scoreA !== scoreB) return scoreB - scoreA;
  
        // estabilidade (caso empate)
        return String(a.id).localeCompare(String(b.id));
      });
  
      return reordered;
    });
  }, []);


  useEffect(() => {
    if (!roomId) return;

    setLoading(true);

    const fetchRoom = async () => {
      let roomDataToUse = null;

      try {
        const cachedRoomData = localStorage.getItem(`room_${roomId}`);

        if (cachedRoomData) {
          console.log('[SETUP] ✅ Dados da sala encontrados no LocalStorage.');
          roomDataToUse = JSON.parse(cachedRoomData);
        } else {
          console.error('[SETUP] ❌ Dados da sala não encontrados no LocalStorage.');
          navigate('/');
          return;
        }

        if (roomDataToUse) {
          setRoom(roomDataToUse);
          setIsPublic(roomDataToUse.isPublic);
          setMaxPlayers(parseInt(roomDataToUse.maxNumberOfPlayers) || 10);
          setCurrentScoreboard(roomDataToUse.scoreboard || []);

          // ✅ Carregar quiz se existir
          if (roomDataToUse.quizId) {
            setQuiz({ id: roomDataToUse.quizId, topic: roomDataToUse.quiz?.topic });
          }
        }

        console.log('[SETUP] 🔌 Conectando ao WebSocket...');
        await webSocketService.connect();

        webSocketService.subscribeToPlayerJoins(roomId, handlePlayerJoin);
        webSocketService.subscribeToPlayerExits(roomId, handlePlayerExit);
        webSocketService.subscribeToScoreUpdates(roomId, handleScoreUpdate);

        // Assinar contagem regressiva antes do início da partida.
        // Salvamos no localStorage e navegamos para a tela do quiz assim que a contagem começar,
        // para garantir que os jogadores vejam o timer pré-quiz antes da primeira questão.
        webSocketService.subscribeToStartMatchCountdown(roomId, (countdown) => {
          try {
            // Guarda o payload para que a página do quiz possa inicializar o timer mesmo
            // se a mensagem chegar antes da assinatura lá.
            try { localStorage.setItem(`startMatchCountdown_${roomId}`, JSON.stringify(countdown)); } catch(e) { console.warn('Não foi possível salvar startMatchCountdown no localStorage', e); }

            const rem = countdown?.timeRemainingInSeconds ?? 0;
            if (rem > 0) {
              const quizIdToUse = roomDataToUse?.quizId || quiz?.id;
              if (quizIdToUse) {
                navigate(`/jogar-quiz/${quizIdToUse}?roomId=${roomId}`);
              }
            }
          } catch (e) {
            console.warn('Erro processando start match countdown na sala', e);
          }
        });

        // Se o backend enviar diretamente a primeira questão, navegar também
        webSocketService.subscribeToQuestion(roomId, (questionPayload) => {
          try {
            const quizIdToUse = roomDataToUse?.quizId || quiz?.id;
            if (quizIdToUse) {
              // Salva a primeira questão recebida temporariamente para o player que navegará
              try {
                localStorage.setItem(`lastQuestion_${quizIdToUse}`, JSON.stringify(questionPayload));
              } catch (e) {
                console.warn('Não foi possível salvar lastQuestion no localStorage', e);
              }

              navigate(`/jogar-quiz/${quizIdToUse}?roomId=${roomId}`);
            }
          } catch (e) {
            console.warn('Erro ao processar question WS na sala', e);
          }
        });

          // Também assinar o countdown por questão para salvar caso chegue antes da página do quiz
          webSocketService.subscribeToQuestionCountdown(roomId, (timeData) => {
            try {
              try { localStorage.setItem(`questionCountdown_${roomId}`, JSON.stringify(timeData)); } catch (e) { console.warn('Não foi possível salvar questionCountdown no localStorage', e); }
            } catch (e) {
              console.warn('Erro processando question-countdown na sala', e);
            }
          });

      } catch (error) {
        console.error("❌ Erro fatal ao carregar a sala:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();

    return () => {
      webSocketService.cleanupRoomSubscriptions(roomId);
    };
  }, [roomId, navigate, handlePlayerJoin, handlePlayerExit, handleGameStart]);

  const isHost = room ? String(userId) === String(room.owner?.id) : false;

  const handleUpdateRoomSettings = async () => {
    if (!isHost || !room) return;

    await roomService.updateRoom(room.id, {
      ownerId: userId,
      isPublic,
      maxNumberOfPlayers: maxPlayers,
      quizId: quiz?.id || null
    });

    const updatedRoom = {
      ...room,
      isPublic,
      maxNumberOfPlayers: maxPlayers,
      quizId: quiz?.id,
      scoreboard: currentScoreboard
    };
    setRoom(updatedRoom);
    localStorage.setItem(`room_${room.id}`, JSON.stringify(updatedRoom));
  };

  const handleLeaveLobby = async () => {
    if (!room) return;

    if (isHost) {
      await roomService.deleteRoom(room.id, userId);
    } else {
      const scoreIdFromLocal = localStorage.getItem('scoreId');

      if (scoreIdFromLocal) {
        webSocketService.sendPlayerLeft(room.id, scoreIdFromLocal);
        await new Promise(resolve => setTimeout(resolve, 500));
        await roomService.exitRoom(scoreIdFromLocal);
      }
    }

    localStorage.removeItem('currentRoomId');
    localStorage.removeItem(`room_${room.id}`);
    localStorage.removeItem('scoreId');

    navigate('/');
  };

  const handleStartGame = async () => {
    const quizId = room.quizId || quiz?.id || localStorage.getItem('lastCreatedQuizId');

    if (!quizId) {
      alert('Nenhum quiz vinculado à sala. Crie um quiz primeiro.');
      return;
    }

    const savedQuiz = localStorage.getItem(`quiz_${quizId}`);
    if (!savedQuiz) {
      alert('Quiz não encontrado localmente. Por favor, (re)crie o quiz.');
      return;
    }

    try {
      // Envia pedido ao backend via WebSocket para iniciar a partida.
      // O backend deve publicar a contagem regressiva e o game-start para navegar os players.
      await webSocketService.connect();
      webSocketService.sendStartMatch(room.id, userId);
      // Não navegamos aqui — aguardamos o backend emitir `game-start` que chamará handleGameStart

    } catch (error) {
      console.error('❌ Erro ao iniciar jogo:', error);
      alert('Erro ao iniciar o jogo. Tente novamente.');
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-darkGunmetal flex items-center justify-center w-full">
        <div className="text-white text-2xl">Carregando lobby...</div>
      </div>
    );
  }

  const roomOwnerId = room.owner?.id;

  return (
    <div className="min-h-screen bg-raisinBlack flex justify-center w-[1140px]">
      <main className="container mx-auto px-4 py-8">

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">Lobby</h1>
          <p className="text-gray-400 text-lg">
            {isHost ? 'Configure sua sala e escolha o quiz' : 'Aguardando o host iniciar o quiz'}
          </p>

        </div>

        <div className="flex flex-row gap-6 justify-center">

          {/* Coluna Esquerda - Players */}
          <Scoreboard  
            roomId={roomId}
            playersScoreboardList={currentScoreboard}
            maxPlayers={maxPlayers}
            roomOwnerId={roomOwnerId}
            userId={userId}
          />
          

          {/* Coluna Central - Configurações */}
          <div className="flex flex-col gap-6 w-[800px]">

            <div className="bg-darkGunmetal rounded-md px-12 py-4 flex flex-col gap-4">

              <div className='flex justify-center gap-2 h-[120px]'>

                <div className="flex flex-col items-center justify-between bg-darkGunmetal p-5 rounded-md border border-plumpPurple/20">
                  <div>
                    <label className="text-white font-semibold text-lg">Sala pública:</label>
                  </div>

                  {isHost ? (
                    <ToggleSwitch
                      isOn={isPublic}
                      onToggle={() => setIsPublic(!isPublic)}
                      disabled={loading}
                    />
                  ) : (
                    <div className={`px-4 py-2 rounded-md font-semibold ${isPublic ? 'bg-emerald-950 text-pistachio' : 'bg-gray-700 text-gray-300'
                      }`}>
                      {isPublic ? 'PÚBLICA' : 'PRIVADA'}
                    </div>
                  )}
                </div>

                <div className="bg-darkGunmetal p-5 rounded-lg border border-plumpPurple/20 flex flex-col items-center justify-center">
                  <label className="text-white font-semibold text-lg block text-center px-2">
                    Máximo de jogadores: <span className="text-pistachio text-2xl ">{maxPlayers}</span>
                  </label>

                  {isHost && (
                    <div className="flex w-full items-center gap-4 mt-3">
                      <input
                        type="range"
                        min="2"
                        max="10"
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                        disabled={loading}
                        className="flex-1 h-2 bg-plumpPurple/30 rounded-lg appearance-none cursor-pointer accent-pistachio"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-darkGunmetal p-6 rounded-lg border border-plumpPurple/20">
                  <p className="text-gray-400 text-sm mb-2">Código da Sala:</p>
                  <div className="flex flex-col items-center justify-between">
                    <p className="text-pistachio text-4xl font-bold tracking-widest font-mono">
                      {room.roomCode}
                    </p>
                  </div>
                </div>

              </div>

              {isHost && (
                <div className="flex flex-col gap-3 bg-amber- ">
                  <button
                    onClick={handleUpdateRoomSettings}
                    disabled={loading}
                    className="flex-1 bg-plumpPurple text-white font-bold py-3 px-4 rounded-md hover:bg-plumpPurple/80 disabled:opacity-50 transition text-lg"
                  >
                    Salvar Configurações
                  </button>
                  <div className="flex flex-col gap-3">

                    <button
                      onClick={() => navigate(`/criar-quiz?roomId=${room.id}`)}
                      disabled={loading}
                      className="flex-1 bg-pistachio text-raisinBlack font-bold py-3 px-4 rounded-md hover:bg-green-500 disabled:opacity-50 transition text-lg"
                    >
                      {quiz ? 'Trocar Quiz' : 'Criar Quiz'}
                    </button>
                  </div>
                </div>
              )}
              
              {quiz && (
                <div className="inline-block bg-pistachio/20 px-6 py-10 rounded-md border-2 border-pistachio">
                  <p className="text-pistachio font-semibold">
                    📚 Quiz selecionado: {quiz.topic}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-6 justify-center">

              <button
                onClick={handleLeaveLobby}
                disabled={loading}
                className="flex justify-center items-center gap-2 w-full bg-red-700 text-white font-semibold text-[24px] py-3 px-8 rounded-md hover:bg-white hover:text-red-700 disabled:opacity-50 transition"
              >
                <StepBack />
                {isHost ? ' Fechar Sala' : ' Sair do Lobby'}
              </button>
              <button
                onClick={handleStartGame}
                disabled={loading || !quiz}
                className="w-full bg-silver text-white font-semibold text-[24px] py-3 px-8 rounded-md hover:bg-white hover:text-silver disabled:opacity-50 transition"
              >
                {quiz ? 'Iniciar quiz' : '⚠️ Crie um Quiz Primeiro'}
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default Room;