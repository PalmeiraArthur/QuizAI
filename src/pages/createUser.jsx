// src/components/createUser.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';

const CreateUser = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Por favor, digite um nome de usuário');
      return;
    }

    if (username.length > 30) {
      setError('O nome de usuário deve ter no máximo 30 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const user = await userService.createUser(username);

      localStorage.setItem('userId', user.id);
      localStorage.setItem('username', user.username);

      console.log('Usuário criado:', user);

      navigate('/home');

    } catch (err) {
      console.error('Erro ao criar usuário:', err);
      setError(err.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 items-center justify-center min-h-screen">

      <img src="/quizAiTransparente.svg" alt="Logo" className="w-48 h-auto" />

      <div className="w-[90vw] max-w-[600px] bg-darkGunmetal rounded-lg shadow-xl px-8 py-12 flex flex-col gap-5">

        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo! 👋</h2>
          <p className="text-gray-400">Crie seu usuário para começar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
              disabled={loading}
              className="w-full px-4 py-3 bg-raisinBlack text-white border border-none rounded-lg focus:outline-none focus:ring-4 focus:ring-plumpPurple focus:border-transparent disabled:opacity-50"
              placeholder="username"
              autoFocus
            />

            <p className="text-xs text-gray-500 mt-2">
              {username.length}/30 caracteres
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-lg">
              <p className="font-semibold">Erro!</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full bg-pistachio text-white text-[20px] font-semibold py-3 px-4 rounded-lg hover:bg-white hover:text-pistachio hover:cursor-pointer disabled:pointer-events-none disabled:select-none disabled:opacity-50 disabled:cursor-not-allowed "
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Criando...
              </span>
            ) : (
              'Criar Usuário'
            )}
          </button>

        </form>
      </div>
    </div>
  );
};

export default CreateUser;