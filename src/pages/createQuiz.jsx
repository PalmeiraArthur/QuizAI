// src/pages/CreateQuiz.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import quizService from '../services/quizService';
import roomService from '../services/roomService';
import Navbar from '../components/navbar';

function CreateQuiz() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        topic: '',
        numberOfQuestions: 5,
        numberOfAnswers: 4
    });
    const [showModal, setShowModal] = useState(false);
    const [createdQuiz, setCreatedQuiz] = useState(null);
    const [createdRoom, setCreatedRoom] = useState(null);
    
    // Verificar se veio do Lobby
    const [fromLobby, setFromLobby] = useState(false);
    const [existingRoomId, setExistingRoomId] = useState(null);

    useEffect(() => {
        // Verificar se tem uma sala já criada no lobby
        const lobbyState = localStorage.getItem('lobbyState');
        const currentRoomId = localStorage.getItem('currentRoomId');
        
        if (lobbyState && currentRoomId) {
            setFromLobby(true);
            setExistingRoomId(currentRoomId);
            console.log('Criando quiz para sala existente:', currentRoomId);
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'topic' ? value : parseInt(value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.topic.trim()) {
            setError('Por favor, digite um tópico para o quiz');
            return;
        }

        if (formData.numberOfQuestions < 1 || formData.numberOfQuestions > 15) {
            setError('O número de questões deve ser entre 1 e 15');
            return;
        }

        if (formData.numberOfAnswers < 2 || formData.numberOfAnswers > 6) {
            setError('O número de alternativas deve ser entre 2 e 6');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            console.log('Gerando quiz...', formData);

            const userId = localStorage.getItem('userId');

            // Gera o quiz com base no formulário
            const quiz = await quizService.generateQuiz(
                formData.topic.trim(),
                formData.numberOfQuestions,
                formData.numberOfAnswers
            );

            console.log('Quiz criado:', quiz);

            let room;

            if (fromLobby && existingRoomId) {
                // Se veio do Lobby, apenas vincular o quiz à sala existente
                console.log('Vinculando quiz à sala existente:', existingRoomId);
                
                await roomService.updateRoom(existingRoomId, userId, quiz.id);
                
                // Buscar dados da sala atualizada
                const savedRoom = localStorage.getItem(`room_${existingRoomId}`);
                room = savedRoom ? JSON.parse(savedRoom) : { id: existingRoomId };
                room.quiz = quiz; // Adicionar quiz à sala
                
                console.log('Quiz vinculado à sala existente');
            } else {
                // Fluxo antigo: deletar sala antiga e criar nova
                const oldRoomId = localStorage.getItem('currentRoomId');
                if (oldRoomId) {
                    try {
                        await roomService.deleteRoom(oldRoomId, userId);
                        console.log('Sala antiga deletada:', oldRoomId);
                        localStorage.removeItem('currentRoomId');
                    } catch (err) {
                        console.log('Nenhuma sala anterior ou erro ao deletar:', err.message);
                    }
                }

                // Cria uma nova sala e vincula ao quiz
                room = await roomService.createRoom(userId, true, 10);
                console.log('Sala criada:', room);

                await roomService.updateRoom(room.id, userId, quiz.id);
                console.log('Quiz vinculado à nova sala');
            }

            // Salva localmente
            localStorage.setItem(`quiz_${quiz.id}`, JSON.stringify(quiz));
            localStorage.setItem(`room_${room.id}`, JSON.stringify(room));
            localStorage.setItem('currentRoomId', room.id);
            localStorage.setItem('lastCreatedQuizId', quiz.id); // Flag para o Lobby saber que tem quiz novo

            // Mostrar modal de sucesso
            setCreatedQuiz(quiz);
            setCreatedRoom(room);
            setShowModal(true);

        } catch (err) {
            console.error('Erro ao criar quiz:', err);
            setError(err.message || 'Erro ao gerar quiz. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLobby = () => {
        const lobbyId = localStorage.getItem('returnToLobby');
        if (lobbyId) {
            navigate(`/lobby/${lobbyId}`);
        } else {
            navigate('/');
        }
    };

    const handlePlayNow = () => {
        navigate(`/play-quiz/${createdQuiz.id}?roomId=${createdRoom.id}`);
    };

    return (
        <div className="min-h-screen bg-darkGunmetal flex justify-center w-[1140px]">
            <Navbar />

            {showModal && createdQuiz && createdRoom && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-raisinBlack rounded-2xl shadow-2xl p-8 w-[90%] max-w-lg border border-plumpPurple/30 text-center animate-fade-in">
                        <h2 className="text-3xl font-bold text-pistachio mb-4">Quiz Criado com Sucesso! 🎉</h2>

                        <p className="text-white text-lg mb-6">
                            O quiz <strong className="text-pistachio">"{createdQuiz.topic}"</strong> foi criado com sucesso.
                        </p>

                        <div className="bg-darkGunmetal p-4 rounded-lg mb-6 border border-plumpPurple/30">
                            <p className="text-gray-300 text-sm mb-1">Código da Sala:</p>
                            <p className="text-pistachio text-2xl font-bold tracking-wide font-mono">{createdRoom.roomCode}</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            {fromLobby ? (
                                <>
                                    <button
                                        onClick={handleBackToLobby}
                                        className="bg-pistachio text-raisinBlack font-bold px-6 py-3 rounded-lg hover:bg-green-500 transition-all"
                                    >
                                        ← Voltar para o Lobby
                                    </button>
                                    <button
                                        onClick={handlePlayNow}
                                        className="bg-plumpPurple text-white font-bold px-6 py-3 rounded-lg hover:bg-plumpPurple/80 transition-all"
                                    >
                                        ▶ Jogar Agora
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handlePlayNow}
                                        className="bg-pistachio text-raisinBlack font-bold px-6 py-3 rounded-lg hover:bg-green-500 transition-all"
                                    >
                                        ▶ Jogar Agora
                                    </button>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all"
                                    >
                                        Fechar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <main className="container mx-auto px-4 py-8 mt-[100px] md:mt-[100px]">
                <div className="max-w-2xl mx-auto">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2">
                            {fromLobby ? '🎯 Criar Quiz para sua Sala' : 'Criar Novo Quiz'}
                        </h1>
                        <p className="text-gray-400">
                            {fromLobby 
                                ? 'Configure o quiz que será jogado na sua sala'
                                : 'Use IA para gerar um quiz personalizado'
                            }
                        </p>
                        {fromLobby && (
                            <div className="mt-3 inline-block bg-plumpPurple/20 border border-plumpPurple px-4 py-2 rounded-lg">
                                <p className="text-pistachio text-sm">
                                    ✓ Sala já criada - Apenas configure o quiz
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Formulário */}
                    <div className="bg-raisinBlack rounded-lg shadow-xl p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Tópico */}
                            <div>
                                <label className="block text-white font-semibold mb-2">
                                    Tópico do Quiz
                                </label>
                                <input
                                    type="text"
                                    name="topic"
                                    value={formData.topic}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full px-4 py-3 bg-darkGunmetal text-white border-2 border-plumpPurple/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-plumpPurple focus:border-transparent disabled:opacity-50"
                                    placeholder="Ex: História do Brasil, Matemática, Geografia..."
                                />
                                <p className="text-gray-400 text-xs mt-1">
                                    Seja específico para melhores resultados
                                </p>
                            </div>

                            {/* Número de Questões */}
                            <div>
                                <label className="block text-white font-semibold mb-2">
                                    Número de Questões
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        name="numberOfQuestions"
                                        value={formData.numberOfQuestions}
                                        onChange={handleChange}
                                        min="1"
                                        max="15"
                                        disabled={loading}
                                        className="flex-1 h-2 bg-darkGunmetal rounded-lg appearance-none cursor-pointer accent-pistachio"
                                    />
                                    <span className="text-white font-bold text-2xl bg-darkGunmetal px-4 py-2 rounded-lg min-w-[60px] text-center">
                                        {formData.numberOfQuestions}
                                    </span>
                                </div>
                                <p className="text-gray-400 text-xs mt-1">
                                    Mínimo: 1 | Máximo: 15
                                </p>
                            </div>

                            {/* Número de Alternativas */}
                            <div>
                                <label className="block text-white font-semibold mb-2">
                                    Alternativas por Questão
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        name="numberOfAnswers"
                                        value={formData.numberOfAnswers}
                                        onChange={handleChange}
                                        min="2"
                                        max="6"
                                        disabled={loading}
                                        className="flex-1 h-2 bg-darkGunmetal rounded-lg appearance-none cursor-pointer accent-pistachio"
                                    />
                                    <span className="text-white font-bold text-2xl bg-darkGunmetal px-4 py-2 rounded-lg min-w-[60px] text-center">
                                        {formData.numberOfAnswers}
                                    </span>
                                </div>
                                <p className="text-gray-400 text-xs mt-1">
                                    Mínimo: 2 | Máximo: 6
                                </p>
                            </div>

                            {/* Erro */}
                            {error && (
                                <div className="p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-lg">
                                    <div className="flex items-start">
                                        <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <p className="font-semibold text-sm">Erro</p>
                                            <p className="text-sm">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Preview */}
                            <div className="p-4 bg-darkGunmetal/50 border border-plumpPurple/30 rounded-lg">
                                <p className="text-gray-400 text-sm mb-2">Prévia:</p>
                                <p className="text-white">
                                    Será gerado um quiz sobre <strong className="text-pistachio">{formData.topic || '...'}</strong> com{' '}
                                    <strong className="text-pistachio">{formData.numberOfQuestions}</strong> questões, cada uma com{' '}
                                    <strong className="text-pistachio">{formData.numberOfAnswers}</strong> alternativas.
                                </p>
                            </div>

                            {/* Botão de Submit */}
                            <button
                                type="submit"
                                disabled={loading || !formData.topic.trim()}
                                className="w-full bg-pistachio text-raisinBlack font-bold py-4 px-6 rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg shadow-lg"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Gerando Quiz com IA... (pode demorar até 1 min)
                                    </span>
                                ) : (
                                    '🤖 Gerar Quiz com IA'
                                )}
                            </button>

                            {/* Botão de Cancelar */}
                            <button
                                type="button"
                                onClick={() => fromLobby ? navigate('/lobby') : navigate('/')}
                                disabled={loading}
                                className="w-full bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                            >
                                ← {fromLobby ? 'Voltar para o Lobby' : 'Cancelar'}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default CreateQuiz;