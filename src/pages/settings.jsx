import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import BackgroundPattern from '../components/backgroundPattern';
import playSound, { setMasterVolume, getMasterVolume } from '../services/soundService';
import { X } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal'; // Importa o modal

function Settings() {

    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    const [showLogoutModal, setShowLogoutModal] = useState(false); // Estado do modal
    const [volumePercent, setVolumePercent] = useState(100);

    const handleLogout = () => {
        setShowLogoutModal(true); // Abre o modal
    };

    const confirmLogout = () => {
        localStorage.clear();
        navigate('/user');
    };

    const handleCloseSettings = () => { 
        playSound('/src/assets/sounds/closeSettings.wav', { volume: 0.6 });
        navigate('/');
    };

    useEffect(() => {
        // load saved volume (0-1) from localStorage or fallback to service
        try {
            const saved = localStorage.getItem('soundVolume');
            if (saved !== null) {
                const v = Number(saved);
                const clamped = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : getMasterVolume();
                setMasterVolume(clamped);
                setVolumePercent(Math.round(clamped * 100));
            } else {
                const mv = getMasterVolume();
                setVolumePercent(Math.round(mv * 100));
            }
        } catch (err) {
            console.warn('Settings: failed to read soundVolume', err);
        }
    }, []);

    const handleVolumeChange = (percent) => {
        const clamped = Math.max(0, Math.min(100, Number(percent)));
        setVolumePercent(clamped);
        const v = clamped / 100;
        setMasterVolume(v);
        try { localStorage.setItem('soundVolume', String(v)); } catch (err) { console.warn('Settings: failed to save soundVolume', err); }
    };

    const handlePreviewSound = () => {
        // play a short click/ping at full base volume (masterVolume will be applied)
        playSound('/src/assets/sounds/click.mp3', { volume: 1 });
    };

    return (
        <BackgroundPattern>
            <div className='h-screen w-screen flex justify-center items-center'>
                
                <main className='relative flex flex-col justify-between items-center bg-russianViolet bg-gradient-padrao shadow-padrao p-13 w-full max-w-[1140px] h-full mx-[20px] max-h-[740px] rounded-md'>

                    <button onClick={handleCloseSettings}
                        className='absolute top-5 right-5 flex justify-center items-center p-1 bg bg-red-600/0 rounded-sm border-2 border-red-700 group hover:bg-red-600/100 hover:border-red-700'>

                        <X className='group-hover:rotate-90 text-white stroke-3 '/>

                    </button>

                    <h1 className='text-2xl font-semibold'>
                        Configurações
                    </h1>

                    {/* Volume controller */}
                    <div className='w-full max-w-md mt-6'>
                        <label className='text-white font-medium mb-2 block'>Volume dos sons: <span className='text-pistachio font-bold'>{volumePercent}%</span></label>
                        <div className='flex items-center gap-3'>
                            <input
                                type='range'
                                min='0'
                                max='100'
                                value={volumePercent}
                                onChange={(e) => handleVolumeChange(e.target.value)}
                                className='w-full'
                            />
                            <button
                                onClick={handlePreviewSound}
                                className='px-3 py-1 bg-pistachio text-raisinBlack rounded-md font-semibold hover:opacity-90'
                            >
                                Testar
                            </button>
                        </div>
                    </div>

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