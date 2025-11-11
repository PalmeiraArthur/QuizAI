// src/pages/findRooms.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import roomService from '../services/roomService';
import Navbar from '../components/navbar';
import RoomCard from '../components/roomCard';
import toast from 'react-hot-toast';
import webSocketService from '../services/websocketService';
import { RefreshCw, SquarePlus, ArrowBigLeftDash } from 'lucide-react';
import CustomToaster from '../components/customToaster';

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

      console.log('[FRONTEND]: Resposta completa do backend:', joinResponse);
      console.log('[FRONTEND]: joinResponse.scoreboard:', joinResponse.scoreboard);

      const guestScore = joinResponse.scoreboard;
      console.log('[FRONTEND]: Score do jogador recebido:', guestScore);

      if (!guestScore) {
        throw new Error("Resposta da API incompleta: scoreboard não encontrado.");
      }

      const guestScoreId = guestScore.id;

      if (!guestScoreId) {
        throw new Error("Resposta da API incompleta: ID do placar não encontrado.");
      }

      console.log('[FRONTEND]: Score ID extraído:', guestScoreId);

      localStorage.setItem('scoreId', guestScoreId);

      const roomDataToStore = {
        id: joinResponse.roomId,
        roomCode: joinResponse.roomCode,
        isPublic: joinResponse.isPublic,
        maxNumberOfPlayers: joinResponse.maxNumberOfPlayers,
        owner: joinResponse.owner,
        scoreboard: [
          guestScore,
          ...joinResponse.playersScores
        ],
      };

      console.log('💾 Dados da sala para armazenar:', roomDataToStore);

      localStorage.setItem('currentRoomId', roomDataToStore.id);
      localStorage.setItem(`room_${roomDataToStore.id}`, JSON.stringify(roomDataToStore));

      console.log('🔌 Conectando ao WebSocket...');
      await webSocketService.connect();

      console.log('📤 Enviando evento de join...', {
        roomId: roomDataToStore.id,
        scoreId: guestScoreId
      });
      webSocketService.sendPlayerJoin(roomDataToStore.id, guestScoreId);

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
      <div className="min-h-screen bg-darkGunmetal ">
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
    <div className="relative min-h-screen bg-russianViolet  shadow-padrao w-dvw flex justify-start flex-col gap-20 items-center px-3 
    lg:py-28 lg:px-18 lg:gap-10 lg:w-[1140px]">
      <CustomToaster/>
      

      <button onClick={() => navigate('/')}>
        <ArrowBigLeftDash className='absolute top-3 left-3 h-auto w-9 text-pistachio
        lg:top-10 lg:left-18 lg:w-10' />
      </button>

      <main className="container flex flex-col gap-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 md:text-4xl">
              Salas Públicas
            </h1>
            <p className="text-gray-400">
              Veja as salas criadas por outros usuários
            </p>
          </div>

          <button
            onClick={loadRooms}
            className="flex group gap-2 px-2 py-2 bg-pistachio text-white font-bold rounded-md hover:bg-white hover:text-pistachio"
          >
            <RefreshCw className='group-hover:rotate-180 stroke-3' />
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
          <div className="flex flex-wrap gap-3 max-h-[450px] overflow-y-auto bg-darkGunmetal rounded-md shadow-[inset_0px_0px_13px_1px_rgba(0,_0,_0,_0.3)] px-9 py-6 text-center
          lg:justify-start lg:max-h-[520px] lg:overflow-y-auto">
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
      </main>

      {/* Footer */}
      <footer className='flex gap-10'>
        <button
          onClick={loadRooms}
          className="flex justify-center items-center gap-2 px-6 py-3 text-xl font-semibold bg-pistachio text-white rounded-md hover:bg-white hover:text-pistachio"
        >
          <SquarePlus className='stroke-3' />
          Criar Sala
        </button>
      </footer>
    </div>
  );
}

export default FindRooms;