import { useNavigate } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();
    const username = localStorage.getItem('username');

    const handleLogout = () => {
        if (window.confirm('Deseja realmente sair?')) {
            localStorage.clear();
            navigate('/user');
        }
    };

    return (
        <nav className="hidden bg-raisinBlack/80 fixed top-0 w-[1140px] h-[80px] rounded-b-md md:block">
            <div className="flex justify-between items-center h-full px-6">
                <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer ">
                    <img src="/quizAiTransparente.svg" alt="Logo" className="w-22 h-auto" />
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-gray-400 text-xs">Bem-vindo,</p>
                        <p className="text-white font-semibold">{username}</p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        Sair
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;