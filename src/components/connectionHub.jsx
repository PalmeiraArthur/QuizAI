import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useShinyEffect } from '../hooks/shinyEffect'; // adicionado

// roomService and webSocketService not used here; selection flow handled in /criar-sala

function ConnectionHub() {
    const navigate = useNavigate();
    const [loading, _setLoading] = useState(false);
    const { containerRef, handleMouseMove } = useShinyEffect(); // use shiny effect

    return (
        <div  >

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

        </div>
    )
}

export default ConnectionHub