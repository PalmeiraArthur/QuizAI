import { useState } from 'react';
import { useNavigate } from "react-router-dom";
// roomService and webSocketService not used here; selection flow handled in /criar-sala

function ConnectionHub() {
    const navigate = useNavigate();
    const [loading, _setLoading] = useState(false);

    
    
    return (
        <div className="flex justify-center items-center gap-2 bg-russianViolet p-[20px] w-[380px] h-[75px] rounded-[50px] mt-[30px] font-semibold text-[16px]
        md:w-[617px] md:h-[100px] md:text-[22px] lg:w-[617px] lg:h-[100px]">

            <button
                onClick={() => navigate('/criar-quiz')}
                disabled={loading}
                className="bg-slateBlue rounded-[50px] w-[120px] h-[50px] hover:bg-white hover:text-slateBlue cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                md:w-[180px] md:h-[61px]"
            >
                Criar Quiz
            </button>

            <button
                onClick={() => navigate('/encontrar-salas')}
                disabled={loading}
                className="bg-slateBlue rounded-[50px] w-[120px] h-[50px] hover:bg-white hover:text-slateBlue cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                md:w-[180px] md:h-[61px]"
            >
                Salas
            </button>

        </div>
    )
}

export default ConnectionHub