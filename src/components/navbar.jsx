import { useNavigate } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();
    const username = localStorage.getItem('username');

    const handleSettingsClick = () => {
        const audio = new Audio('/src/assets/sounds/openSettings.wav');
        audio.play();
        navigate('/configurações');
    };

    return (
        <div>
            <nav className="hidden bg-russianViolet fixed top-0 w-[1140px] h-[80px] rounded-b-md
            lg:block">

                <div className="flex justify-between items-center h-full px-6">
                    <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer ">
                        <img src="/quizAiTransparente.svg" alt="Logo" className="w-22 h-auto" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-pistachio text-xs">Bem-vindo,</p>
                            <p className="text-white font-semibold">{username}</p>
                        </div>
                        <button onClick={handleSettingsClick} >
                            <img
                                src="src/assets/icons/gear.svg"
                                alt="Configurações"
                                className="w-auto h-8 hover:opacity-80 cursor-pointer hover:rotate-90"
                            />
                        </button>
                    </div>
                </div>
            </nav>

            {/*-------------------------- Mobile Navbar------------------------------------------ */}
            <nav className='flex flex-row justify-end itemsce gap-4 mt-4
            lg:hidden'>
                <div className="text-right">
                    <p className="text-pistachio text-xs">Bem-vindo,</p>
                    <p className="text-white font-semibold">{username}</p>
                </div>
                <button onClick={handleSettingsClick}>
                    <img
                        src="src/assets/icons/gear.svg"
                        alt="Configurações"
                        className="w-6 h-6 hover:opacity-80 cursor-pointer"
                    />
                </button>

            </nav>
        </div>
    );
}

export default Navbar;