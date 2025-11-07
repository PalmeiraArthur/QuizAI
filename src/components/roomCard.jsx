// src/components/RoomCard.jsx
import { Crown, Users, RectangleEllipsis, Copy, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

function RoomCard({ room, currentUsername, onJoinRoom }) {
  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    toast.success('Código copiado!');
  };

  return (
    <div className="bg-raisinBlack w-[300px] h-[230px] rounded-md shadow-xl  flex flex-col gap-6 justify-center items-center">
      {/* Header do Card */}
      <div className="flex flex-col w-fit gap-1">
        <h3 className="text-[24px] font-semibold text-white">
          {room.quizTopic}
        </h3>
        <span className="flex justify-center items-center bg-emerald-950 py-1 text-pistachio text-xs font-semibold rounded-md">
          PÚBLICA
        </span>
      </div>

      {/* Informações da Sala */}
      <div className="grid grid-cols-3 grid-rows-1">
        {/* Owner */}
        <div className="flex flex-col justify-center items-center">
          <Crown />
          <span className="font-semibold text-pistachio">
            <span className="whitespace-nowrap font-semibold">
              {room.ownerName}
              {room.ownerName === currentUsername && (
                <span className="text-pistachio"> (Você)</span>
              )}
            </span>
          </span>
        </div>

        {/* Players Count */}
        <div className="flex flex-col justify-center items-center">
          <Users />
          <p className="text-pistachio font-semibold">
            1/{room.maxNumberOfPlayers}
          </p>
        </div>

        {/* Room Code */}
        <div className="flex flex-col items-center">
          <RectangleEllipsis />
          <code className="text-pistachio font-semibold tracking-wider">
            {room.roomCode}
          </code>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-1">
        <button
          onClick={handleCopyCode}
          className="flex px-2 py-2 bg-plumpPurple text-white font-semibold rounded-md hover:bg-purple-600 text-sm"
        >
          <Copy />
        </button>

        <button
          onClick={() => onJoinRoom(room.roomCode, room.id)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-pistachio text-white font-semibold rounded-md text-sm"
        >
          <LogIn className="stroke-3 size-5.5" />
          <p>Entrar na sala</p>
        </button>
      </div>
    </div>
  );
}

export default RoomCard;