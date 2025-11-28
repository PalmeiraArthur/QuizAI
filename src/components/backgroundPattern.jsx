// src/components/BackgroundPattern.jsx
import patternSvg from '../assets/pattern.svg';

const BackgroundPattern = ({ children }) => {
  return (
    <div className="relative min-h-screen">
      {/* Background Pattern */}
      <div 
        className="fixed inset-0 -z-10 opacity-4"
        style={{ 
          backgroundImage: `url(${patternSvg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Conteúdo */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default BackgroundPattern;