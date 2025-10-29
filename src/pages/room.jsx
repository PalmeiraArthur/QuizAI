import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import roomService from '../services/roomService';
import webSocketService from '../services/websocketService';

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
      console.log('[JOIN WS] 📨 Payload completo recebido:', joinPayload);
      console.log('[JOIN WS] 📨 Tipo do payload:', typeof joinPayload);
      console.log('[JOIN WS] 📨 joinPayload.id:', joinPayload.id);
      console.log('[JOIN WS] 📨 joinPayload.player:', joinPayload.player);
      const normalizedPayload = {
        id: joinPayload.scoreId || joinPayload.id, // Aceitar ambos os formatos
        score: joinPayload.score || 0,
        player: joinPayload.player
      };

      console.log('[JOIN WS] 📦 Payload normalizado:', normalizedPayload);

      const isAlreadyPresent = prevScores.some(score => score.id === normalizedPayload.id);

      if (!isAlreadyPresent) {
        console.log(`[JOIN WS]  ${normalizedPayload.player?.username}`);

        const updatedScoreboard = [...prevScores, normalizedPayload];

        const roomData = JSON.parse(localStorage.getItem(`room_${roomId}`));
        if (roomData) {
          roomData.scoreboard = updatedScoreboard;
          localStorage.setItem(`room_${roomId}`, JSON.stringify(roomData));
          console.log('💾 localStorage atualizado com novo jogador');
        }

        return updatedScoreboard;
      }

      console.log('[JOIN WS] ⚠️ Jogador já presente, não adicionado');
      return prevScores;
    });
  }, [roomId])

  const handlePlayerExit = useCallback((exitPayload) => {
    console.log('[EXIT WS] 📨 ============ EVENTO DE SAÍDA RECEBIDO ============');
    console.log('[EXIT WS] 📨 Payload completo:', exitPayload);
    console.log('[EXIT WS] 📨 scoreId:', exitPayload.scoreId);
    console.log('[EXIT WS] 📨 player:', exitPayload.player);

    setCurrentScoreboard(prevScores => {
      console.log('[EXIT WS] 📊 Scoreboard ANTES da remoção:', prevScores);

      const scoreIdToRemove = exitPayload.scoreId || exitPayload.id;
      console.log('[EXIT WS] 🎯 ID a ser removido:', scoreIdToRemove);

      const updatedScoreboard = prevScores.filter(score => {
        const keep = score.id !== scoreIdToRemove;
        console.log(`[EXIT WS] Score ${score.id} === ${scoreIdToRemove}? ${!keep} (${keep ? 'MANTER' : 'REMOVER'})`);
        return keep;
      });

      console.log(`[EXIT WS] 👋 Jogador removido: ${exitPayload.player?.username}`);
      console.log('[EXIT WS] 📊 Scoreboard DEPOIS da remoção:', updatedScoreboard);
      console.log('[EXIT WS] 📊 Quantidade: ', prevScores.length, '→', updatedScoreboard.length);

      // Atualizar localStorage
      const roomData = JSON.parse(localStorage.getItem(`room_${roomId}`));
      if (roomData) {
        roomData.scoreboard = updatedScoreboard;
        localStorage.setItem(`room_${roomId}`, JSON.stringify(roomData));
        console.log('💾 localStorage atualizado - jogador removido');
      }

      console.log('[EXIT WS] ✅ ============ FIM DO EVENTO DE SAÍDA ============');
      return updatedScoreboard;
    });
  }, [roomId]);


  useEffect(() => {
    if (!roomId) return;

    setLoading(true);

    const fetchRoom = async () => {
      let roomDataToUse = null;

      try {
        // 🚀 PASSO 1: Buscar os dados no LocalStorage
        const cachedRoomData = localStorage.getItem(`room_${roomId}`);

        if (cachedRoomData) {
          console.log('[SETUP] ✅ Dados da sala encontrados no LocalStorage.');
          roomDataToUse = JSON.parse(cachedRoomData);
        } else {
          // Se não houver dados, a sala é inválida ou o usuário não deveria estar aqui.
          console.error('[SETUP] ❌ Dados da sala não encontrados no LocalStorage.');
          navigate('/');
          return; // Para o fluxo se não houver dados
        }

        // 2. Atualizar todos os estados do React com os dados do LocalStorage
        if (roomDataToUse) {
          setRoom(roomDataToUse);
          setIsPublic(roomDataToUse.isPublic);
          setMaxPlayers(parseInt(roomDataToUse.maxNumberOfPlayers) || 10);
          setCurrentScoreboard(roomDataToUse.scoreboard || []);
        }

        // 3. Conectar e Inscrever-se no WebSocket APÓS ter os dados da sala
        console.log('[SETUP] 🔌 Conectando ao WebSocket...');
        await webSocketService.connect();
        console.log('[SETUP] ✅ WebSocket conectado e inscrevendo...');

        webSocketService.subscribeToPlayerJoins(roomId, handlePlayerJoin);
        webSocketService.subscribeToPlayerExits(roomId, handlePlayerExit);

      } catch (error) {
        console.error("❌ Erro fatal ao carregar a sala:", error);
        // Em caso de erro (ex: falha na conexão WS), ainda tentamos navegar.
        // Se a falha foi na obtenção do cachedRoomData, o navigate já ocorreu.
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();

    return () => {
      // Limpeza das inscrições ao desmontar o componente
      webSocketService.cleanupSubscriptions(roomId);
    };
  }, [roomId, navigate, handlePlayerJoin, handlePlayerExit]);

  const isHost = room ? String(userId) === String(room.owner?.id) : false;

  // Atualizar configurações da sala (SOMENTE HOST)
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

  // Sair do lobby
  const handleLeaveLobby = async () => {
    if (!room) return;

    if (isHost) {
      // Host deleta a sala
      await roomService.deleteRoom(room.id, userId);
      
    } else {
      // Player normal sai da sala
      const scoreIdFromLocal = localStorage.getItem('scoreId');

      // Usamos o scoreId do localStorage, que é mais confiável para a saída do próprio jogador.
      if (scoreIdFromLocal) {
        console.log('🚪 [LEAVE] 1️⃣ Enviando WS sendPlayerLeft PRIMEIRO...');
        // Usamos o ID do localStorage
        webSocketService.sendPlayerLeft(room.id, scoreIdFromLocal);

        // ✅ DELAY DE 500MS MANTIDO para a Race Condition
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('🚪 [LEAVE] 2️⃣ Agora chamando exitRoom...');
        // Usamos o ID do localStorage
        await roomService.exitRoom(scoreIdFromLocal);
      } else {
        console.error('⚠️ Não foi possível encontrar o scoreId no localStorage para sair da sala.');
      }
    }

    // Limpar localStorage
    localStorage.removeItem('currentRoomId');
    localStorage.removeItem(`room_${room.id}`);
    localStorage.removeItem('scoreId');

    navigate('/');
  };


  if (!room) {
    return (
      <div className="min-h-screen bg-darkGunmetal flex items-center justify-center w-full">
        <div className="text-white text-2xl">Carregando lobby...</div>
      </div>
    );
  }

  const roomOwnerId = room.owner?.id;

  console.log('--- DEBUG ROOM ---');
  console.log('ID do Usuário Logado (userId):', userId);
  console.log('ID do Dono da Sala (roomOwnerId):', roomOwnerId);
  console.log('É o Host?:', isHost);
  console.log('Scoreboard Atual:', currentScoreboard);
  console.log('------------------');

  return (
    <div className="min-h-screen bg-raisinBlack flex justify-center w-[1140px]">
      <main className="container textce mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">Lobby</h1>
          <p className="text-gray-400 text-lg">
            {isHost ? 'Configure sua sala e escolha o quiz' : 'Aguardando o host iniciar o quiz'}
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-row gap-6 justify-center ">

          {/* Coluna Esquerda - Players */}
          <div className="rounded-md w-[211px]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-white">Jogadores</h2>
              <div className="bg-pistachio text-raisinBlack px-4 py-2 rounded-md font-bold text-lg">
                {currentScoreboard.length}/{maxPlayers}
              </div>
            </div>

            {/* Lista de jogadores */}
            <div className="bg-darkGunmetal space-y-3 rounded-md p-1">
              {currentScoreboard.map((playerScore, i) => {
                const scoreId = playerScore.id;
                const playerId = playerScore.player?.id;
                const isPlayerHost = String(playerId) === String(roomOwnerId);
                const isYou = String(playerId) === String(userId);

                return (
                  <div
                    key={scoreId}
                    className={`${isYou ? 'bg-plumpPurple' : 'bg-darkGunmetal/80'} rounded-lg p-4 flex items-center gap-3 border border-plumpPurple/20`}
                  >
                    <div className="w-10 h-10 bg-pistachio rounded-full flex items-center justify-center text-raisinBlack font-bold text-xl">
                      {isPlayerHost ? '👑' : '👤'}
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {isYou ? 'Você' : playerScore.player?.username || `Jogador ${i + 1}`}
                      </p>
                      {isPlayerHost && <p className="text-gray-300 text-sm">Host</p>}
                    </div>
                  </div>
                );
              })}

              {/* Players vazios */}
              {Array(Math.max(0, maxPlayers - currentScoreboard.length))
                .fill(null)
                .map((_, i) => (
                  <div
                    key={i}
                    className="bg-darkGunmetal rounded-lg p-4 flex items-center gap-3 opacity-50 border border-plumpPurple/20"
                  >
                    <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                    <p className="text-gray-500">Aguardando jogador...</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Coluna Central - Configurações e Quiz */}
          <div className="flex flex-col gap-6 w-[800px]">

            {/* Configurações da Sala */}
            <div className="bg-darkGunmetal rounded-md px-12 py-4 flex flex-col gap-4">

              <div className='flex justify-center gap-2 h-[120px]'>

                {/* Sala pública */}
                <div className="flex flex-col items-center justify-between bg-darkGunmetal p-5 rounded-md border border-plumpPurple/20">
                  <div>
                    <label className="text-white font-semibold text-lg">Sala pública:</label>
                  </div>

                  {/* ✅ HOST: Toggle editável | PLAYER: Badge de status */}
                  {isHost ? (
                    <button
                      onClick={() => setIsPublic(!isPublic)}
                      disabled={loading}
                      className={`relative w-16 h-8 rounded-full transition-colors ${isPublic ? 'bg-pistachio' : 'bg-gray-600'
                        }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${isPublic ? 'translate-x-8' : ''
                          }`}
                      />
                    </button>
                  ) : (
                    <div className={`px-4 py-2 rounded-md font-semibold ${isPublic ? 'bg-emerald-950 text-pistachio' : 'bg-gray-700 text-gray-300'
                      }`}>
                      {isPublic ? 'PÚBLICA' : 'PRIVADA'}
                    </div>
                  )}
                </div>

                {/* Máximo de jogadores */}
                <div className="bg-darkGunmetal p-5 rounded-lg border border-plumpPurple/20">
                  <label className="text-white font-semibold text-lg block mb-3 text-center">
                    Máximo de jogadores: <span className="text-pistachio text-2xl ml-2">{maxPlayers}</span>
                  </label>

                  {/* ✅ HOST: Slider editável | PLAYER: Apenas visualização */}
                  {isHost ? (
                    <div className="flex items-center gap-4">
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
                  ) : (
                    <div className="flex justify-center">
                      <div className="bg-plumpPurple/20 px-6 py-2 rounded-lg">
                        <span className="text-white text-sm">Definido pelo host</span>
                      </div>
                    </div>
                  )}

                  <p className="text-gray-400 text-sm mt-2">
                    Entre 2 e 10 jogadores
                  </p>
                </div>

                {/* Código da sala */}
                <div className="bg-darkGunmetal p-6 rounded-lg border border-plumpPurple/20">
                  <p className="text-gray-400 text-sm mb-2">Código da Sala:</p>
                  <div className="flex flex-col items-center justify-between">
                    <p className="text-pistachio text-4xl font-bold tracking-widest font-mono">
                      {room.roomCode}
                    </p>
                  </div>
                </div>

              </div>

              {/* ✅ Botões do Host: Salvar Configurações, Criar Quiz e Jogar Quiz */}
              {isHost && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdateRoomSettings}
                      disabled={loading}
                      className="flex-1 bg-plumpPurple text-white font-bold py-3 px-4 rounded-lg hover:bg-plumpPurple/80 disabled:opacity-50 transition text-lg"
                    >
                      Salvar Configurações
                    </button>

                    <button
                      onClick={() => window.location.href = `/criar-quiz?roomId=${room.id}`}
                      disabled={loading}
                      className="flex-1 bg-pistachio text-raisinBlack font-bold py-3 px-4 rounded-lg hover:bg-green-500 disabled:opacity-50 transition text-lg"
                    >
                      Criar Quiz
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      // Iniciar o quiz — navegamos para /play-quiz/:id com ?roomId
                      const quizId = room.quizId || room.quiz?.id || localStorage.getItem('lastCreatedQuizId');
                      if (!quizId) {
                        alert('Nenhum quiz vinculado à sala. Crie um quiz primeiro.');
                        return;
                      }

                      // Garantir que o quiz esteja salvo no localStorage
                      const savedQuiz = localStorage.getItem(`quiz_${quizId}`);
                      if (!savedQuiz) {
                        // Tentar buscar do backend (se houver endpoint) — o room pode ter apenas quizId
                        // Para simplicidade, apenas alertamos e pedimos para criar novamente
                        alert('Quiz não encontrado localmente. Por favor, (re)crie o quiz.');
                        return;
                      }

                      // Navegar para a página de jogo com o roomId como query
                      window.location.href = `/play-quiz/${quizId}?roomId=${room.id}`;
                    }}
                    disabled={loading}
                    className="w-full bg-silver text-white font-semibold text-[24px] py-3 px-8 rounded-lg hover:bg-white hover:text-silver disabled:opacity-50 transition"
                  >
                    Jogar Quiz
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-20 justify-center">
              <button
                onClick={handleLeaveLobby}
                disabled={loading}
                className="bg-silver text-white font-semibold text-[24px] py-3 px-8 rounded-lg hover:bg-white hover:text-silver disabled:opacity-50 transition"
              >
                {isHost ? '← Fechar Sala' : '← Sair do Lobby'}
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default Room;