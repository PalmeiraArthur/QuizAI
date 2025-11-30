import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import quizService from '../services/quizService';
import roomService from '../services/roomService';

function CreateQuiz() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get('roomId'); // Pega roomId da URL
    
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        try {
            setLoading(true);
            setError(null);

            // 1. Criar novo quiz
            console.log('🎮 Criando quiz...');
            const quiz = await quizService.createQuiz({
                topic: formData.topic,
                numberOfQuestions: formData.numberOfQuestions,
                numberOfAnswers: formData.numberOfAnswers
            });

            console.log('✅ Quiz criado:', quiz);

            // 2. Salvar quiz localmente
            localStorage.setItem('lastCreatedQuizId', quiz.id);
            localStorage.setItem(`quiz_${quiz.id}`, JSON.stringify(quiz));

            // 3. Se veio de uma sala, vincular o quiz à sala
            if (roomId) {
                console.log('🔗 Vinculando quiz à sala:', roomId);
                
                const userId = localStorage.getItem('userId');
                
                // Atualizar a sala com o quizId
                await roomService.updateRoom(roomId, {
                    ownerId: userId,
                    quizId: quiz.id
                });

                console.log('✅ Quiz vinculado à sala com sucesso!');

                // Atualizar localStorage da sala
                const roomData = JSON.parse(localStorage.getItem(`room_${roomId}`) || '{}');
                if (roomData.id) {
                    roomData.quizId = quiz.id;
                    roomData.quiz = { id: quiz.id, topic: quiz.topic };
                    localStorage.setItem(`room_${roomId}`, JSON.stringify(roomData));
                    console.log('💾 localStorage da sala atualizado');
                }

                // Redirecionar de volta para a sala
                navigate(`/sala/${roomId}`);
            } else {
                // Se não veio de uma sala, vai para a página do quiz
                navigate(`/quiz/${quiz.id}`);
            }

        } catch (err) {
            console.error('❌ Erro ao criar quiz:', err);
            setError('Erro ao criar quiz. Por favor tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        // Se veio de uma sala, volta para ela; senão vai para home
        if (roomId) {
            navigate(`/room/${roomId}`);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-russianViolet bg-gradient-padrao flex justify-center w-[1140px] shadow-padrao">
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Criar Quiz
                        </h1>
                        {roomId && (
                            <p className="text-pistachio text-sm">
                                Este quiz será vinculado à sala automaticamente
                            </p>
                        )}
                    </div>

                    <div className="bg-russianViolet rounded-md shadow-padrao p-8">
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
                            </div>

                            <div>
                                <label className="block text-white font-semibold mb-2">
                                    Alternativas por Questão
                                </label>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, numberOfAnswers: 2 }))}
                                        disabled={loading}
                                        aria-pressed={formData.numberOfAnswers === 2}
                                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                                            formData.numberOfAnswers === 2
                                                ? 'bg-pistachio text-raisinBlack'
                                                : 'bg-darkGunmetal text-white border-2 border-plumpPurple/30 hover:border-plumpPurple'
                                        } disabled:opacity-50`}
                                    >
                                        2 Opções
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, numberOfAnswers: 4 }))}
                                        disabled={loading}
                                        aria-pressed={formData.numberOfAnswers === 4}
                                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                                            formData.numberOfAnswers === 4
                                                ? 'bg-pistachio text-raisinBlack'
                                                : 'bg-darkGunmetal text-white border-2 border-plumpPurple/30 hover:border-plumpPurple'
                                        } disabled:opacity-50`}
                                    >
                                        4 Opções
                                    </button>
                                </div>
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
                                className="w-full bg-pistachio text-raisinBlack font-bold py-4 px-6 rounded-lg hover:bg-raisinBlack hover:text-pistachio disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg shadow-lg"
                            >
                                {loading ? 'Gerando Quiz com IA... (pode demorar até 1 min)' : 'Gerar Quiz com IA'}
                            </button>

                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={loading}
                                className="w-full bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 transition-colors hover:bg-white hover:text-red-800"
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