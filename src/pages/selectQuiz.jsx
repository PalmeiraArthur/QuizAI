import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import roomService from '../services/roomService';
import webSocketService from '../services/websocketService';

function SelectQuiz() {
  const navigate = useNavigate();
  const [localQuizzes, setLocalQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const quizzes = Object.keys(localStorage)
      .filter(k => k.startsWith('quiz_'))
      .map(k => {
        try {
          return JSON.parse(localStorage.getItem(k));
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    setLocalQuizzes(quizzes);
    if (quizzes.length > 0) setSelectedQuizId(quizzes[0].id);
  }, []);

  const handleCreateRoomWithQuiz = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return navigate('/user');

    setLoading(true);
    try {
      // create room
      const room = await roomService.createRoom({ ownerId: userId, isPublic: true, maxNumberOfPlayers: 10 });

      // attach quiz
      if (selectedQuizId) {
        await roomService.updateRoom(room.id, { ownerId: userId, isPublic: true, maxNumberOfPlayers: room.maxNumberOfPlayers || 10, quizId: selectedQuizId });
      }

      // Normalize ownerScoreboard -> scoreboard and store
      const roomToStore = { ...room };
      if (roomToStore.ownerScoreboard) {
        roomToStore.scoreboard = [roomToStore.ownerScoreboard];
        delete roomToStore.ownerScoreboard;
      }
      if (!roomToStore.scoreboard) roomToStore.scoreboard = [];

      localStorage.setItem('currentRoomId', room.id);
      localStorage.setItem(`room_${room.id}`, JSON.stringify(roomToStore));
      if (room.ownerScoreboard?.id) localStorage.setItem('scoreId', room.ownerScoreboard.id);

      // connect websocket and join
      await webSocketService.connect();
      const scoreId = roomToStore.scoreboard[0]?.id || localStorage.getItem('scoreId');
      if (scoreId) webSocketService.sendPlayerJoin(room.id, scoreId);
      else webSocketService.sendPlayerJoin(room.id);

      navigate(`/sala/${room.id}`);
    } catch (err) {
      console.error('Erro ao criar sala com quiz:', err);
      alert('Erro ao criar sala. Veja console.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmptyRoom = async () => {
    // create room without attaching quiz
    setSelectedQuizId(null);
    await handleCreateRoomWithQuiz();
  };

  return (
    <div className="min-h-screen bg-darkGunmetal flex items-center justify-center">
      <div className="max-w-2xl w-full p-6">
        <h1 className="text-3xl text-white font-bold mb-4">Criar Sala</h1>

        {localQuizzes.length === 0 ? (
          <div className="bg-raisinBlack p-6 rounded-md text-center">
            <p className="text-gray-400 mb-4">Nenhum quiz local encontrado.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => navigate('/criar-quiz')} className="px-4 py-2 bg-pistachio rounded-md">Criar Quiz</button>
              <button onClick={handleCreateEmptyRoom} className="px-4 py-2 bg-plumpPurple rounded-md">Criar Sala Vazia</button>
            </div>
          </div>
        ) : (
          <div className="bg-raisinBlack p-6 rounded-md">
            <p className="text-gray-300 mb-4">Selecione um quiz local para anexar à sala:</p>
            <ul className="space-y-3 mb-4">
              {localQuizzes.map(q => (
                <li key={q.id} className={`p-3 rounded-md cursor-pointer ${selectedQuizId === q.id ? 'bg-plumpPurple/30' : 'bg-darkGunmetal'}`} onClick={() => setSelectedQuizId(q.id)}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-semibold">{q.topic}</p>
                      <p className="text-gray-400 text-sm">{q.questions?.length || 0} perguntas</p>
                    </div>
                    <div className="text-pistachio font-bold">Selecionar</div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex gap-2">
              <button onClick={handleCreateRoomWithQuiz} disabled={loading} className="px-4 py-2 bg-pistachio rounded-md">Criar Sala com Quiz Selecionado</button>
              <button onClick={handleCreateEmptyRoom} disabled={loading} className="px-4 py-2 bg-plumpPurple rounded-md">Criar Sala Vazia</button>
              <button onClick={() => navigate('/criar-quiz')} className="px-4 py-2 bg-gray-600 rounded-md">Criar Novo Quiz</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SelectQuiz;
