
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
    <div className="min-h-screen bg-raisinBlack flex justify-center">

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
            <div className="bg-darkGunmetal rounded-lg shadow-[inset_0px_0px_13px_1px_rgba(0,_0,_0,_0.3)] p-12 text-center">

              <h3 className="text-2xl font-bold text-white mb-2">
                Nenhuma sala pública disponível
              </h3>
              <p className="text-gray-400 mb-6">
                Seja o primeiro a criar uma sala!
              </p>

            </div>
          ) : (
            <div className="flex justify-start bg-darkGunmetal rounded-md shadow-[inset_0px_0px_13px_1px_rgba(0,_0,_0,_0.3)] p-6 text-center">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-raisinBlack w-[300px] h-[230px] rounded-md shadow-xl p-6 flex flex-col gap-6 justify-center items-center "
                >
                  {/* Header do Card */}
                  <div className="flex flex-col w-fit gap-1 ">

                    <h3 className="text-[24px] font-semibold text-white">
                      {room.quizTopic}
                    </h3>
                    <span className="flex justify-center items-center bg-emerald-950 py-1 text-pistachio text-xs font-semibold rounded-md">
                      PÚBLICA
                    </span>

                  </div>

                  {/* Informações da Sala */}
                  <div className="grid grid-cols-3 grid-rows-1">

                    <div className='flex flex-col justify-center items-center gap-3'>
                      <img src="src\assets\sounds\iconsButtons\crown.svg" width="30" />

                      <span
                        className={`font-semibold ${room.ownerName === currentUsername ? 'text-pistachio' : 'text-white'
                          }`}
                      >
                        <span className="whitespace-nowrap text-[14px] font-semibold">
                          {room.ownerName}
                          {room.ownerName === currentUsername && (
                            <span className="text-pistachio"> (Você)</span>
                          )}
                        </span>
                      </span>

                    </div>

                    <div className='flex flex-col justify-center items-center gap-1'>
                      <img src="src\assets\sounds\iconsButtons\maxPlayers.svg" width="21" />

                      <p className='text-pistachio font-semibold'>
                        1/{room.maxNumberOfPlayers}
                      </p>

                    </div>

                    <div className="flex flex-col items-center">

                      <img src="src\assets\sounds\iconsButtons\codeIcon.svg" width="30" />
                      <code className="text-pistachio text-[18px] font-semibold racking-wider">
                        {room.roomCode}
                      </code>

                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(room.roomCode);
                        toast.success('Código copiado!');
                      }}
                      className="flex-1 px-4 py-2 bg-plumpPurple text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors text-sm"
                    >
                      <img src="src\assets\sounds\iconsButtons\copyIcon.svg" width="20" />
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(room.roomCode);
                        toast.success('Código copiado!');
                      }}
                      className="flex gap-2 px-4 py-2 bg-pistachio text-white font-semibold rounded-lg transition-colors text-sm"
                    >
                      <img src="src\assets\sounds\iconsButtons\joinIcon.svg" width="20" />
                      <p>
                        Entrar na sala
                      </p>
                    </button>

                  </div>
                </div>
              ))}
            </div>
          )}


        </div>
      </main>
    </div>
  );
}

export default Rooms;