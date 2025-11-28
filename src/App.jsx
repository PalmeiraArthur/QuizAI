// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/home'
import CreateUser from './pages/createUser'
import CreateQuiz from './pages/createQuiz'
import QuizPage from './pages/quizPage'
import PlayQuiz from './pages/playQuiz'
import Settings from './pages/settings'
import Room from './pages/room'
import FindRooms from './pages/findRooms'

const ProtectedRoute = ({ children }) => {
  const userId = localStorage.getItem('userId');

  if (!userId) {
    return <Navigate to="/user" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const userId = localStorage.getItem('userId');

  if (userId) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
    
      <Routes>
        {/* Rota pública - só acessa se NÃO tiver usuário */}
        <Route path="/user" element={<PublicRoute> <CreateUser /> </PublicRoute>} />

        {/* Rotas protegidas - só acessa se TIVER usuário */}
        <Route path="/" element={<ProtectedRoute> <Home /> </ProtectedRoute>} />

        <Route path="/criar-quiz" element={<ProtectedRoute> <CreateQuiz /> </ProtectedRoute>} />

        <Route path="/quiz/:id" element={<ProtectedRoute> <QuizPage /> </ProtectedRoute>} />

        <Route path="/jogar-quiz/:id" element={<ProtectedRoute> <PlayQuiz /> </ProtectedRoute>} />

        <Route path="/achar-salas" element={<ProtectedRoute> <FindRooms /> </ProtectedRoute>} />

        <Route path="/sala/:roomId" element={<ProtectedRoute> <Room /> </ProtectedRoute>} />

        <Route path="/configuracoes" element={<ProtectedRoute> <Settings /> </ProtectedRoute>} />
       
        <Route path="*" element={localStorage.getItem('userId') ? <Navigate to="/" /> : <Navigate to="/user" />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App