// src/pages/Lobby.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import roomService from '../services/roomService';
import Navbar from '../components/navbar';
import toast, { Toaster } from 'react-hot-toast';

function Lobby() {
  const navigate = useNavigate();
  const { roomId } = useParams(); // Pegar o ID da sala pela URL

  // Estado da sala
  const [room, setRoom] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quiz, setQuiz] = useState(null);

  const userId = localStorage.getItem('userId');

  // Carregar dados da sala quando a página carrega
  useEffect(() => {
    if (roomId) {
      loadRoomData();
    }
  }, [roomId]);

  // Verificar se voltou do CreateQuiz com quiz criado
  useEffect(() => {
    const lastQuizId = localStorage.getItem('lastCreatedQuizId');
    if (lastQuizId) {
      const savedQuiz = localStorage.getItem(`quiz_${lastQuizId}`);
      if (savedQuiz) {
        setQuiz(JSON.parse(savedQuiz));
        localStorage.removeItem('lastCreatedQuizId'); // Limpar flag
      }
    }
  }, []);

  const loadRoomData = () => {
    const savedRoom = localStorage.getItem(`room_${roomId}`);
    if (savedRoom) {
      const roomData = JSON.parse(savedRoom);
      setRoom(roomData);
      setIsPublic(roomData.isPublic);
      setMaxPlayers(roomData.maxNumberOfPlayers);

      // Verificar se já tem quiz associado
      if (roomData.quizId) {
        const savedQuiz = localStorage.getItem(`quiz_${roomData.quizId}`);
        if (savedQuiz) {
          setQuiz(JSON.parse(savedQuiz));
        }
      }
    }
  };

  // Ir para criar quiz
  const handleCreateQuiz = () => {
    if (!room) {
      setError('Erro: Sala não encontrada');
      return;
    }

    // Salvar o ID da sala atual para voltar depois
    localStorage.setItem('returnToLobby', room.id);

    navigate('/criar-quiz');
  };

  // Iniciar partida
  const handleStartGame = () => {
    if (!quiz) {
      setError('Adicione um quiz antes de iniciar a partida');
      return;
    }

    navigate(`/play-quiz/${quiz.id}?roomId=${room.id}`);
  };


  // Compartilhar código
  const handleShareCode = () => {
    if (room?.roomCode) {
      navigator.clipboard.writeText(room.roomCode);
      toast.success('Código copiado!');
    }
  };
  // Atualizar configurações da sala
  const handleUpdateRoomSettings = async () => {
    if (!room) return;

    try {
      setLoading(true);
      setError(null);

      await roomService.updateRoom(room.id, userId, quiz?.id, {
        isPublic,
        maxNumberOfPlayers: maxPlayers
      });

      const updatedRoom = {
        ...room,
        isPublic,
        maxNumberOfPlayers: maxPlayers,
        quizId: quiz?.id
      };
      setRoom(updatedRoom);
      localStorage.setItem(`room_${room.id}`, JSON.stringify(updatedRoom));
      toast.success('Configurações atualizadas com sucesso!');

    } catch (err) {
      console.error('Erro ao atualizar sala:', err);
      setError(err.message || 'Erro ao atualizar configurações');
    } finally {
      setLoading(false);
    }
  };

  // Sair do lobby
  const handleLeaveLobby = async () => {
    if (!room) {
      navigate('/');
      return;
    }

    const confirmLeave = window.confirm('Tem certeza que deseja sair? A sala será deletada.');

    if (confirmLeave) {
      try {
        // Deletar a sala do backend
        await roomService.deleteRoom(room.id, userId);

        // Limpar localStorage
        localStorage.removeItem('currentRoomId');
        localStorage.removeItem(`room_${room.id}`);
        if (quiz) {
          localStorage.removeItem(`quiz_${quiz.id}`);
        }

        navigate('/');
      } catch (err) {
        console.error('Erro ao deletar sala:', err);
        // Mesmo com erro, limpa e volta
        localStorage.removeItem('currentRoomId');
        localStorage.removeItem(`room_${room.id}`);
        navigate('/');
      }
    }
  };

  // Se não tem sala carregada, mostrar loading
  if (!room) {
    return (
      <div className="min-h-screen bg-darkGunmetal flex items-center justify-center">
        <div className="text-white text-2xl">Carregando lobby...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-raisinBlack flex justify-center w-[1140px]">
      <Toaster
        position="top-center"
        toastOptions={{
          success: {
            style: {
              fontFamily: '"Poppins", sans-serif',
              fontSize: '16px',
              fontWeight: 500,
              color: '#5649B6',
              background: 'white',
            },
            iconTheme: {
              primary: '#5649B6',
              secondary: 'white',
            },
          },
          error: {
            style: {
              fontFamily: '"Poppins", sans-serif',
              fontSize: '16px',
              fontWeight: 500,
              color: '#ef4444',
              background: 'white',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: 'white',
            },
          },
        }}
      />

      <main className="container textce mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">Lobby</h1>
          <p className="text-gray-400 text-lg">Configure sua sala e escolha o quiz</p>
        </div>

        {/* Main Content */}
        <div className="flex flex-row gap-6 justify-center ">

          {/* Coluna Esquerda - Players */}
          <div className=" rounded-md w-[211px] ">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-white">Jogadores</h2>
              <div className="bg-pistachio text-raisinBlack px-4 py-2 rounded-md font-bold text-lg">
                1/{maxPlayers}
              </div>
            </div>

            {/* Lista de jogadores */}
            <div className="bg-darkGunmetal space-y-3  rounded-md p-1 ">
              <div className="bg-plumpPurple rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-pistachio rounded-full flex items-center justify-center text-raisinBlack font-bold text-xl">
                  👑
                </div>
                <div>
                  <p className="text-white font-semibold">Você</p>
                  <p className="text-gray-300 text-sm">Host</p>
                </div>
              </div>

              {/* Players vazios */}
              {[...Array(Math.min(maxPlayers - 1, 19))].map((_, i) => (
                <div key={i} className="bg-darkGunmetal rounded-lg p-4 flex items-center gap-3 opacity-50 border border-plumpPurple/20">
                  <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                  <p className="text-gray-500">Aguardando jogador...</p>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna Central - Configurações e Quiz */}
          <div className="flex flex-col gap-6 w-[800px]">

            {/* Configurações da Sala */}
            <div className="bg-darkGunmetal rounded-md px-12 py-4 flex flex-col gap-4 ">

              <div className='flex justify-center gap-2 h-[120px]'>
                {/* Sala pública */}
                <div className="flex flex-col items-center justify-between bg-darkGunmetal p-5 rounded-md border border-plumpPurple/20">
                  <div>
                    <label className="text-white font-semibold text-lg">Sala pública:</label>
                    <p className="text-gray-400 text-sm mt-1">

                    </p>
                  </div>
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
                </div>

                {/* Máximo de jogadores */}
                <div className=" bg-darkGunmetal p-5 rounded-lg border border-plumpPurple/20">
                  <label className="text-white font-semibold text-lg block mb-3 text-center">
                    Máximo de jogadores: <span className="text-pistachio text-2xl ml-2">{maxPlayers}</span>
                  </label>
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

              {/* Botão de salvar configurações */}
              <button
                onClick={handleUpdateRoomSettings}
                disabled={loading}
                className="w-full bg-plumpPurple text-white font-bold py-4 px-6 rounded-lg hover:bg-plumpPurple/80 disabled:opacity-50 transition text-lg"
              >
                Salvar Configurações
              </button>
            </div>

            {/* Escolher Quiz */}
            <div className="bg-darkGunmetal rounded-md p-4 max-h-full h-full flex flex-col gap-6 ">
              <div className='bg-raisinBlack flex flex-row justify-between items-center gap-2 px-4 py-3 rounded-md'>
                <h2 className="text-3xl font-bold text-white">Escolher Quiz</h2>
                <button
                  onClick={handleCreateQuiz}
                  disabled={loading}
                  className="px-3 py-1.5 h-fit rounded-md bg-pistachio text-white font-bold  hover:bg-white hover:text-pistachio disabled:opacity-50 disabled:cursor-not-allowed transition text-xl shadow-lg flex items-center justify-center gap-3"
                >
                  <span className="text-3xl">+</span>
                  Criar Quiz
                </button>
              </div>

              {quiz ? (
                <div className="bg-darkGunmetal p-6 rounded-lg border-2 border-pistachio">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-pistachio mb-2">{quiz.topic}</h3>
                      <p className="text-gray-400">
                        {quiz.questions?.length || 0} questões • {quiz.questions?.[0]?.answers?.length || 0} alternativas cada
                      </p>

                    </div>
                  </div>


                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-400 mb-6 text-lg">
                    Nenhum quiz selecionado. Crie um quiz personalizado com IA!
                  </p>

                </div>
              )}
            </div>
            {/* Botões ações */}
            <div className="mt-6 flex gap-20 justify-center">
              <button
                onClick={handleLeaveLobby}
                disabled={loading}
                className="bg-silver text-white font-semibold text-[24px] py-3 px-8 rounded-lg hover:bg-white hover:text-silver disabled:opacity-50 transition"
              >
                ← Sair do Lobby
              </button>

              <button
                onClick={handleStartGame}
                disabled={loading || !quiz}  // ← Adicione || !quiz
                className="bg-pistachio text-white font-semibold text-[24px] py-3 px-8 rounded-lg hover:bg-white hover:text-pistachio disabled:opacity-50 transition"
              >
                Iniciar partida
              </button>
            </div>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="mt-6 bg-red-900/50 border-2 border-red-500 text-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-6 h-6 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold">Erro</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}


      </main>
    </div>
  );
}

export default Lobby;