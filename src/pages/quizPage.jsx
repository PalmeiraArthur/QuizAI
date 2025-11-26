import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, ArrowLeft } from 'lucide-react';
import BackgroundPattern from '../components/backgroundPattern';
import playSound from '../services/soundService';

function QuizPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadQuiz = () => {
            const savedQuiz = localStorage.getItem(`quiz_${id}`);
            
            if (!savedQuiz) {
                alert('Quiz não encontrado!');
                navigate('/');
                return;
            }

            const quizData = JSON.parse(savedQuiz);
            setQuiz(quizData);
            setLoading(false);
        };

        loadQuiz();
    }, [id, navigate]);

    const handlePlayQuiz = () => {
        playSound('/src/assets/sounds/click.mp3', { volume: 0.6 });
        navigate(`/jogar-quiz/${id}`);
    };

    const handleGoBack = () => {
        playSound('/src/assets/sounds/closeSettings.wav', { volume: 0.6 });
        navigate('/');
    };

    if (loading) {
        return (
            <BackgroundPattern>
                <div className="h-screen w-screen flex justify-center items-center">
                    <div className="text-white text-xl">Carregando quiz...</div>
                </div>
            </BackgroundPattern>
        );
    }

    if (!quiz) {
        return (
            <BackgroundPattern>
                <div className="h-screen w-screen flex justify-center items-center">
                    <div className="text-white text-xl">Quiz não encontrado</div>
                </div>
            </BackgroundPattern>
        );
    }

    const questionsArray = Array.from(quiz.questions || []);

    return (
        <BackgroundPattern>
            <div className="h-screen w-screen flex justify-center items-center p-4">
                <main className="relative flex flex-col gap-20 justify-between items-center bg-russianViolet bg-gradient-padrao shadow-padrao p-13 w-full max-w-[800px] max-h-[600px] rounded-md">
                    
                    <button
                        onClick={handleGoBack}
                        className="absolute top-5 left-5 flex items-center gap-2 px-4 py-2 bg-gray-600/50 rounded-md border-2 border-gray-600 group hover:bg-gray-600 hover:border-gray-700 transition-all"
                    >
                        <ArrowLeft className="text-white stroke-2" />
                        <span className="text-white font-semibold">Voltar</span>
                    </button>

                    {/* Conteúdo Principal */}
                    <div className="flex flex-col justify-center items-center gap-8 text-center flex-1 mt-10">
                        
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">
                                {quiz.topic}
                            </h1>
                            <p className="text-gray-300 text-lg">
                                Pronto para testar seus conhecimentos?
                            </p>
                        </div>

                        {/* Informações do Quiz */}
                        <div className="bg-darkGunmetal/50 rounded-lg p-8 w-full max-w-md border border-plumpPurple/30">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Questões:</span>
                                    <span className="text-pistachio font-bold text-2xl">
                                        {questionsArray.length}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Alternativas por questão:</span>
                                    <span className="text-pistachio font-bold text-2xl">
                                        {questionsArray[0]?.answers?.length || 4}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Pontos por acerto:</span>
                                    <span className="text-pistachio font-bold text-2xl">
                                        10
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Botão Jogar */}
                    <button
                        onClick={handlePlayQuiz}
                        className="flex items-center justify-center gap-3 w-full max-w-md bg-pistachio hover:bg-green-500 text-raisinBlack font-bold py-4 px-6 rounded-lg transition-all duration-200 hover:scale-105 text-lg shadow-lg"
                    >
                        <Play className="w-6 h-6 fill-current" />
                        Jogar Quiz
                    </button>
                </main>
            </div>
        </BackgroundPattern>
    );
}

export default QuizPage;
