
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import roomService from '../services/roomService';
import Navbar from '../components/navbar';
import toast, { Toaster } from 'react-hot-toast';


function Rooms() {
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
      // Converter Set para Array se necessário
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
    <div className="min-h-screen bg-darkGunmetal flex justify-center">
      <Navbar />
      <Toaster
        position="top-center"
        toastOptions={{
          success: {
            style: {
              fontFamily: '"Poppins", sans-serif', // define a fonte específica
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
        }}
      />


      <main className="container px-18 py-8 w-[1140px] md:mt-[100px]">
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
            <div className="bg-raisinBlack rounded-lg shadow-xl p-12 text-center">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Nenhuma sala pública disponível
              </h3>
              <p className="text-gray-400 mb-6">
                Seja o primeiro a criar uma sala!
              </p>
              <button
                onClick={() => navigate('/cria-quiz')}
                className="px-6 py-3 bg-pistachio text-raisinBlack font-bold rounded-lg hover:bg-green-500 transition-colors"
              >
                Criar Quiz
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-raisinBlack w-[300px] rounded-lg shadow-xl p-6 border-2 border-plumpPurple/30 hover:border-plumpPurple transition-all hover:shadow-2xl"
                >
                  {/* Header do Card */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">
                        {room.quizTopic}
                      </h3>
                      <p className="text-gray-400 text-sm flex items-center gap-1">
                        <span>por</span>
                        <span className={`font-semibold ${room.ownerName === currentUsername
                          ? 'text-pistachio'
                          : 'text-white'
                          }`}>
                          {room.ownerName}
                          {room.ownerName === currentUsername && ' (Você)'}
                        </span>
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                        PÚBLICA
                      </span>
                    </div>
                  </div>

                  {/* Informações da Sala */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between gap-3 p-3 bg-darkGunmetal/50 rounded-lg">
                      <span className="text-gray-400 text-sm">Código:</span>
                      <code className="text-pistachio font-bold tracking-wider">
                        {room.id}
                      </code>
                    </div>


                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(room.roomCode);
                        toast.success('Código copiado!');
                      }}
                      className="flex-1 px-4 py-2 bg-plumpPurple text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors text-sm"
                    >
                      Copiar Código
                    </button>
                  
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botão para criar nova sala */}
          {rooms.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => navigate('/criar-quiz')}
                className="px-8 py-3 bg-pistachio text-raisinBlack font-bold rounded-lg  hover:bg-raisinBlack hover:text-pistachio transition-colors text-lg"
              >
                + Criar Novo Quiz
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Rooms;