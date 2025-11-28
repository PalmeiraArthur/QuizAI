import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useShinyEffect } from '../hooks/shinyEffect'; // adicionado

// roomService and webSocketService not used here; selection flow handled in /criar-sala

function ConnectionHub() {
    const navigate = useNavigate();
    const [loading, _setLoading] = useState(false);
    const { containerRef, handleMouseMove } = useShinyEffect(); // use shiny effect

    const handleCreateRoom = async () => {
        const roomOwnerId = localStorage.getItem('userId');
        console.log("FRONTEND: pegando o id do usuário:", roomOwnerId);

        _setLoading(true);

        try {
            const newRoom = await roomService.createRoom({ ownerId: roomOwnerId, isPublic: true, maxNumberOfPlayers: 10 });
            console.log("FRONTEND: Dados completos da nova sala (newRoom):", newRoom); '    '

            localStorage.setItem('currentRoomId', newRoom.id);
            console.log("FRONTEND: ID da sala salva no localStorage:", newRoom.id);

            let roomPlayersScoreboardList = [newRoom.ownerScoreboard];
            let roomData = {...newRoom, scoreboard: roomPlayersScoreboardList};

            localStorage.setItem(`room_${newRoom.id}`, JSON.stringify(roomData));
            console.log("FRONTEND: Dados da sala salvos no localStorage.");

            await webSocketService.connect();
            console.log("FRONTEND: Se conectou com o websocket.");

            navigate(`/sala/${newRoom.id}`);
            console.log("FRONTEND: Navegando para a sala criada.");

        } catch (error) {
            console.error("Erro ao criar sala.", error);
        } finally {
            _setLoading(false);
        }
    };
    
    return (
        <div  className="flex justify-center items-center gap-2 ">

            {/* shiny wrapper aplicado ao botão */}
            <div ref={containerRef} onMouseMove={handleMouseMove} className="shiny-container inline-block">
                <button
                    onClick={() => navigate('/criar-quiz')}
                    disabled={loading}
                    className="bg-slateBlue rounded-md px-[80px] py-[30px] text-2xl font-semibold  hover:bg-white hover:text-slateBlue cursor-pointer transition-colors "
                >
                    Criar Quiz
                </button>
            </div>

            <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="bg-slateBlue rounded-md px-[80px] py-[30px] text-2xl font-semibold  hover:bg-white hover:text-slateBlue cursor-pointer transition-colors "
                
            >
                {loading ? (
                    <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </span>
                ) : (
                    'Criar Sala'
                )}
            </button>

            <button
                onClick={() => navigate('/achar-salas')}
                disabled={loading}
                className="bg-slateBlue rounded-md px-[80px] py-[30px] text-2xl font-semibold  hover:bg-white hover:text-slateBlue cursor-pointer transition-colors "
            >
                Salas
            </button>

        </div>
    )
}

export default ConnectionHub