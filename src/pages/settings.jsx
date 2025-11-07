import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import BackgroundPattern from '../components/backgroundPattern';
import { X } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal'; // Importa o modal

function Settings() {

    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    const [showLogoutModal, setShowLogoutModal] = useState(false); // Estado do modal

    const handleLogout = () => {
        setShowLogoutModal(true); // Abre o modal
    };

    const confirmLogout = () => {
        localStorage.clear();
        navigate('/user');
    };

    const handleCloseSettings = () => { 
        const closeAudio = new Audio('/src/assets/sounds/closeSettings.wav');
        closeAudio.play();
        navigate('/');
    };

    return (
        <BackgroundPattern>
            <div className='p-10 h-screen'>
                <main className='relative bg-russianViolet bg-gradient-padrao shadow-padrao p-13 min-h-[820px] w-screen lg:w-[1140px] flex justify-between flex-col items-center rounded-md'>

                    <button onClick={handleCloseSettings}
                        className='absolute top-5 right-5 flex justify-center items-center p-1 bg bg-red-600/0 rounded-sm border-2 border-red-700 group hover:bg-red-600/100 hover:border-red-700'>

                        <X className='group-hover:rotate-90 text-white stroke-3 '/>

                    </button>

                    <h1 className='text-2xl font-semibold'>
                        Configurações
                    </h1>

                    <button
                        onClick={handleLogout}
                        className="px-10 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-white hover:text-red-600 "
                    >
                        Sair da sessão
                    </button>
                </main>
            </div>

            {/* Modal de Confirmação */}
            <ConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={confirmLogout}
                title="Deseja realmente sair?"
            />
        </BackgroundPattern>
    )
}

export default Settings