import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import websocketService from '../services/websocketService';

const Timer = ({ initialTime, size: sizeProp, strokeWidth, circleColor, progressColor, textColor, onComplete, backendControlled, roomId, onTimeUpdate }) => {
  const sizeMap = {
    sm: 80,
    md: 120,
    lg: 180,
    xl: 240,
  };
  const size = sizeMap[sizeProp] || sizeProp;

  // Estado para armazenar o tempo restante
  const [timeLeft, setTimeLeft] = useState(initialTime);

  // Calcula o raio do círculo externo
  const radius = (size - strokeWidth) / 2;
  // Calcula a circunferência do círculo
  const circumference = 2 * Math.PI * radius;
  // Calcula o deslocamento do traço para representar o tempo restante
  // Isso cria a animação de "preenchimento" ou "esvaziamento" do círculo
  const strokeDashoffset = initialTime > 0 ? circumference - (timeLeft / initialTime) * circumference : 0;

  // Efeito para lidar com o controle do timer pelo backend ou timer local
  useEffect(() => {
    if (backendControlled && roomId) {
      const setupBackendTimer = async () => {
        try {
          await websocketService.connect();
          websocketService.subscribeToTimerUpdates(roomId, (timeRemaining) => {
            setTimeLeft(timeRemaining);
            if (onTimeUpdate) {
              onTimeUpdate(timeRemaining);
            }
            if (timeRemaining <= 0) {
              onComplete();
            }
          });
        } catch (error) {
          console.error("Erro ao conectar ou assinar o timer via websocket:", error);
        }
      };
      setupBackendTimer();

      return () => {
        // Não desconectar aqui, apenas limpar a subscrição específica do timer
        websocketService.cleanupSubscriptions(roomId);
      };
    } else {
      // Lógica do timer local (já existente)
      if (timeLeft <= 0) {
        onComplete();
        return;
      }

      const timerId = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);

      return () => clearInterval(timerId);
    }
  }, [backendControlled, roomId, onComplete, onTimeUpdate, timeLeft, initialTime]); // Dependências do useEffect

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Círculo de fundo */}
        <circle
          stroke={circleColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Círculo de progresso */}
        <circle
          stroke={progressColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} // Inicia o progresso no topo
          strokeDasharray={circumference} // Define o comprimento do traço do círculo
          strokeDashoffset={strokeDashoffset} // Controla o preenchimento do círculo
          style={{ transition: 'stroke-dashoffset 1s linear' }} // Suaviza a transição do progresso
        />
      </svg>
      {/* Texto do tempo restante */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: textColor,
          fontSize: size / 4,
          fontWeight: 'bold',
        }}
      >
        {timeLeft}
      </div>
    </div>
  );
};

Timer.propTypes = {
  initialTime: PropTypes.number.isRequired, // Tempo inicial do contador em segundos
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['sm', 'md', 'lg', 'xl'])]), // Tamanho total do componente (largura e altura)
  strokeWidth: PropTypes.number, // Largura da linha do círculo
  circleColor: PropTypes.string, // Cor do círculo de fundo
  progressColor: PropTypes.string, // Cor do progresso do círculo
  textColor: PropTypes.string, // Cor do texto do tempo restante
  onComplete: PropTypes.func, // Função chamada quando o contador chega a zero
  backendControlled: PropTypes.bool, // Se o timer deve ser controlado pelo backend
  roomId: PropTypes.string, // ID da sala (necessário para controle via backend)
  onTimeUpdate: PropTypes.func, // Função chamada a cada atualização de tempo (backend controlado)
};

Timer.defaultProps = {
  size: 'md',
  strokeWidth: 10,
  circleColor: '#e0e0e0',
  progressColor: '#4CAF50',
  textColor: '#333',
  onComplete: () => console.log('Timer completed!'),
  backendControlled: false,
  roomId: null,
  onTimeUpdate: null,
};

export default Timer;
