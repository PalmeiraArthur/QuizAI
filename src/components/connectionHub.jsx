// src/components/connectionHub.jsx
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import roomService from '../services/roomService';
import webSocketService from '../services/websocketService';

function ConnectionHub() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleCreateRoom = async () => {
        const userId = localStorage.getItem('userId');
        setLoading(true);

        try {
            const newRoom = await roomService.createRoom({ ownerId: userId, isPublic: true, maxNumberOfPlayers: 10 });

            // 1. EXTRAIR O SCORE ID DO HOST da resposta do backend
            // Seu DTO retorna uma lista, então pegamos o ID do primeiro (e único) score.
            const hostScoreId = newRoom.scoreboard[0].scoreId; 

            // 2. Salvar no localStorage
            localStorage.setItem('currentRoomId', newRoom.id);
            localStorage.setItem(`room_${newRoom.id}`, JSON.stringify(newRoom));

            // 3. ENVIAR EVENTO WEBSOCKET (O Host avisa que entrou)
            await webSocketService.connect(); // Garantir que a conexão WS está ativa
            webSocketService.sendPlayerJoin(newRoom.id, hostScoreId);

            // 4. Redirecionar
            navigate(`/sala/${newRoom.id}`);

        } catch (error) {
            console.error("Erro ao criar sala e enviar join:", error);
        } finally {
            setLoading(false);
        }
    };
    // ...

    return (
        <div className="flex justify-center items-center gap-2 bg-raisinBlack p-[20px] w-[359px] h-[75px] rounded-[50px] mt-[30px] font-semibold text-[22px]
        md:w-[617px] md:h-[100px]">

            <button
                onClick={() => navigate('/criar-quiz')}
                disabled={loading}
                className="bg-plumpPurple rounded-[50px] w-[100px] h-[50px] text-[18px] hover:bg-white hover:text-plumpPurple cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                md:w-[180px] md:h-[61px] md:text-[22px]"
            >
                Criar Quiz
            </button>

            <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="bg-plumpPurple rounded-[50px] w-[100px] h-[50px] text-[18px] hover:bg-white hover:text-plumpPurple cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                md:w-[180px] md:h-[61px] md:text-[22px]"
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
                className="bg-plumpPurple rounded-[50px] w-[100px] h-[50px] text-[18px] hover:bg-white hover:text-plumpPurple cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                md:w-[180px] md:h-[61px] md:text-[22px]"
            >
                Salas
            </button>

        </div>
    )
}

export default ConnectionHub