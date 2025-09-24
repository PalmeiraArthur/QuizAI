import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/home'
import QuizPage from './pages/quizPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/quiz/:id" element={<QuizPage />} />
      </Routes>
    </BrowserRouter>

  )
}

export default App
