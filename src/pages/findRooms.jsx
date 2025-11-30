
//src\pages\findRooms.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import roomService from '../services/roomService';
import Navbar from '../components/navbar';
import toast, { Toaster } from 'react-hot-toast';
import webSocketService from '../services/websocketService';
import RoomCard from '../components/roomCard';


function FindRooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUsername = localStorage.getItem('username');

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const publicRooms = await roomService.getPublicRooms();
      console.log('[FRONTEND]: Procurando salas públicas...');


      const roomsArray = Array.isArray(publicRooms) ? publicRooms : Array.from(publicRooms);
      setRooms(roomsArray);
      console.log('Salas públicas:', roomsArray);

    } catch (err) {
      console.error('Erro ao carregar salas:', err);
      setError('Erro ao carregar salas públicas');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomCode, roomId) => {
    const userId = localStorage.getItem('userId');
    setLoading(true);

    if (!userId) {
      toast.error('Usuário não logado.');
      setLoading(false);
      return;
    }

    try {
      const joinResponse = await roomService.joinRoom(roomCode, userId);


      // 2. LOG DE DEBUG - Ver estrutura da resposta
      console.log('[FRONTEND]: Resposta completa do backend:', joinResponse);
      console.log('[FRONTEND]: joinResponse.scoreboard:', joinResponse.scoreboard);

      // 3. Extrair o scoreId do novo jogador
      const guestScore = joinResponse.scoreboard;
      console.log('[FRONTEND]: Score do jogador recebido:', guestScore);


      if (!guestScore) {
        throw new Error("Resposta da API incompleta: scoreboard não encontrado.");
      }

      const guestScoreId = guestScore.id;

      // Validação: Verificar se guestScoreId existe
      if (!guestScoreId) {
        throw new Error("Resposta da API incompleta: ID do placar não encontrado.");
      }

      console.log('[FRONTEND]: Score ID extraído:', guestScoreId);

      // ✅ CORREÇÃO: Salvar o scoreId para que room.jsx possa usá-lo ao sair da sala
      localStorage.setItem('scoreId', guestScoreId);

      // 4. Montar objeto da sala
      const roomDataToStore = {
        id: joinResponse.roomId,
        roomCode: joinResponse.roomCode,
        isPublic: joinResponse.isPublic,
        maxNumberOfPlayers: joinResponse.maxNumberOfPlayers,
        owner: joinResponse.owner,
        scoreboard: [
          guestScore, // Você (novo jogador)
          ...joinResponse.playersScores // Jogadores que já estavam
        ],
      };

      console.log('💾 Dados da sala para armazenar:', roomDataToStore);

      // 5. Salvar no localStorage
      localStorage.setItem('currentRoomId', roomDataToStore.id);
      localStorage.setItem(`room_${roomDataToStore.id}`, JSON.stringify(roomDataToStore));

      // 6. ENVIAR EVENTO WEBSOCKET
      console.log('🔌 Conectando ao WebSocket...');
      await webSocketService.connect();

      console.log('📤 Enviando evento de join...', {
        roomId: roomDataToStore.id,
        scoreId: guestScoreId
      });
      webSocketService.sendPlayerJoin(roomDataToStore.id, guestScoreId);

      // 7. Redirecionar
      navigate(`/sala/${roomDataToStore.id}`);
      console.log('➡️ Navegando para a sala:', roomDataToStore.id);

    } catch (err) {
      console.error('❌ Erro ao entrar na sala:', err);
      console.error('❌ Stack trace:', err.stack);

      const errorMessage = err.response?.data?.detail || err.message || 'Não foi possível entrar na sala.';
      toast.error(errorMessage);

    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkGunmetal">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)] mt-[100px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pistachio mx-auto mb-4"></div>
            <p className="text-white text-xl">Carregando salas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <main className="container bg-russianViolet px-4 py-18 w-dvw min-h-dvh 
       lg:w-[1140px] lg:p-18">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Salas Públicas
              </h1>
              <p className="text-gray-400">
                Veja as salas criadas por outros usuários
              </p>
            </div>
            <button
              onClick={loadRooms}
              className="px-6 py-3 bg-pistachio text-raisinBlack font-bold rounded-lg hover:bg-raisinBlack hover:text-pistachio transition-colors"
            >
              Atualizar
            </button>
          </div>

          {/* Erro */}
          {error && (
            <div className="p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Lista de Salas */}
          {rooms.length === 0 ? (
            <div className="bg-darkGunmetal rounded-lg shadow-[inset_0px_0px_13px_1px_rgba(0,_0,_0,_0.3)] p-12 text-center">

              <h3 className="text-2xl font-bold text-white mb-2">
                Nenhuma sala pública disponível
              </h3>
              <p className="text-gray-400 mb-6">
                Seja o primeiro a criar uma sala!
              </p>

            </div>
          ) : (
            <div className="bg-darkGunmetal/50 shadow-[inset_0px_0px_15px_0px_rgba(0,_0,_0,_0.1)] rounded-md grid grid-cols-1 justify-center items-center p-4 gap-2
            md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  currentUsername={currentUsername}
                  onJoinRoom={handleJoinRoom}
                />
              ))}
            </div>
          )}


        </div>
      </main>
    </div>
  );
}

export default FindRooms;