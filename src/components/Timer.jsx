import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const Timer = ({ 
  initialTime, 
  currentTime, 
  size: sizeProp, 
  strokeWidth, 
  circleColor, 
  progressColor, 
  textColor, 
  onComplete 
}) => {
  const isControlled = typeof currentTime !== 'undefined';
  const [localTime, setLocalTime] = useState(initialTime);

  // Effect for the uncontrolled timer
  useEffect(() => {
    if (isControlled) return; // Don't run if controlled by parent

    if (localTime <= 0) {
      if (onComplete) {
        onComplete();
      }
      return;
    }

    const timerId = setInterval(() => {
      setLocalTime(t => t - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [isControlled, localTime, onComplete, initialTime]);

  // When used as an uncontrolled component, reset timer if initialTime changes
  useEffect(() => {
    if (!isControlled) {
      setLocalTime(initialTime);
    }
  }, [initialTime, isControlled]);

  const timeLeft = isControlled ? currentTime : localTime;

  const sizeMap = {
    sm: 80,
    md: 120,
    lg: 180,
    xl: 240,
  };
  const size = sizeMap[sizeProp] || sizeProp;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = initialTime > 0 ? circumference - (timeLeft / initialTime) * circumference : 0;


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
  subscriptionType: PropTypes.oneOf(['timer', 'question-countdown']), // Tipo de subscrição para backend
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
  subscriptionType: 'timer',
};

export default Timer;
