// src/pages/CreateQuiz.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import quizService from '../services/quizService';
import roomService from '../services/roomService';


function CreateQuiz() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        topic: '',
        numberOfQuestions: 5,
        numberOfAnswers: 4
    });
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'topic' ? value : parseInt(value)
        }));
    };

    // handleSubmit modificado - cria sala após criar quiz
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        try {
            setLoading(true);
            setError(null);

            const userId = localStorage.getItem('userId');
            if (!userId) {
                throw new Error('Usuário não encontrado');
            }

            // 1. Cleanup: tentar remover sala e quiz anteriores
            const currentRoomId = localStorage.getItem('currentRoomId');
            if (currentRoomId) {
                try {
                    await roomService.deleteRoom(currentRoomId, userId);
                    console.log('✅ Sala anterior removida:', currentRoomId);
                    
                    // Se tinha quiz vinculado, remover também
                    const savedRoom = localStorage.getItem(`room_${currentRoomId}`);
                    const roomObj = savedRoom ? JSON.parse(savedRoom) : null;
                    if (roomObj?.quizId) {
                        try {
                            await quizService.deleteQuiz(roomObj.quizId);
                            localStorage.removeItem(`quiz_${roomObj.quizId}`);
                            console.log('✅ Quiz anterior removido:', roomObj.quizId);
                        } catch (err) {
                            console.warn('⚠️ Falha ao remover quiz anterior:', err);
                        }
                    }
                } catch (err) {
                    console.warn('⚠️ Falha ao remover sala anterior:', err);
                    // Se falhou, tentar buscar sala do owner
                    try {
                        const ownerRoom = await roomService.getRoomByOwner(userId);
                        if (ownerRoom?.id) {
                            await roomService.deleteRoom(ownerRoom.id, userId);
                            console.log('✅ Sala do owner removida:', ownerRoom.id);
                            if (ownerRoom.quizId) {
                                await quizService.deleteQuiz(ownerRoom.quizId);
                                console.log('✅ Quiz do owner removido:', ownerRoom.quizId);
                            }
                        }
                    } catch (ownerErr) {
                        console.warn('⚠️ Falha ao buscar/remover sala do owner:', ownerErr);
                    }
                }
                // Limpar localStorage
                localStorage.removeItem(`room_${currentRoomId}`);
                localStorage.removeItem('currentRoomId');
            }

            // 2. Criar novo quiz
            const quiz = await quizService.createQuiz({
                topic: formData.topic,
                numberOfQuestions: formData.numberOfQuestions,
                numberOfAnswers: formData.numberOfAnswers,
                ownerId: userId
            });

            // 3. Criar nova sala
            const room = await roomService.createRoom(userId, true, 10);

            // 4. Vincular quiz à sala
            await roomService.updateRoom(room.id, userId, quiz.id);

            // 5. Salvar dados
            localStorage.setItem('lastCreatedQuizId', quiz.id);
            localStorage.setItem(`quiz_${quiz.id}`, JSON.stringify(quiz));
            localStorage.setItem('currentRoomId', room.id);
            localStorage.setItem(`room_${room.id}`, JSON.stringify(room));

            // 6. Navegar para lobby
            navigate(`/lobby/${room.id}`);

        } catch (err) {
            console.error('Erro ao criar quiz/sala:', err);
            setError('Erro ao criar quiz. Por favor tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // handleCancel simplificado - só precisa navegar
    const handleCancel = () => navigate('/');

    return (
        <div className="min-h-screen bg-darkGunmetal flex justify-center w-[1140px]">
            <main className="container mx-auto px-4 py-8 ">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Criar Quiz
                        </h1>
                        <p className="text-gray-400">
                            Configure o quiz que será jogado na sua sala.
                        </p>
                    </div>

                    <div className="bg-raisinBlack rounded-lg shadow-xl p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
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

                            <div className="p-4 bg-darkGunmetal/50 border border-plumpPurple/30 rounded-lg">
                                <p className="text-gray-400 text-sm mb-2">Prévia:</p>
                                <p className="text-white">
                                    Será gerado um quiz sobre <strong className="text-pistachio">{formData.topic || '...'}</strong> com{' '}
                                    <strong className="text-pistachio">{formData.numberOfQuestions}</strong> questões, cada uma com{' '}
                                    <strong className="text-pistachio">{formData.numberOfAnswers}</strong> alternativas.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !formData.topic.trim()}
                                className="w-full bg-pistachio text-raisinBlack font-bold py-4 px-6 rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg shadow-lg"
                            >
                                {loading ? 'Gerando Quiz com IA... (pode demorar até 1 min)' : '🤖 Gerar Quiz com IA'}
                            </button>

                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={loading}
                                className="w-full bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                            >
                                ← Cancelar
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default CreateQuiz;