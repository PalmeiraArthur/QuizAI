import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useShinyEffect } from '../hooks/shinyEffect';

function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  const { containerRef, handleMouseMove } = useShinyEffect();
  const [isVisible, setIsVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  // Controla abertura do modal
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 250); 
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        
      {/* Overlay com animação */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm ${
          closing ? 'animate-fade-out' : 'animate-fade-in'
        }`}
        onClick={handleClose}
      />

      {/* Modal principal */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className={`shiny-container relative flex flex-col gap-2 bg-gradient-padrao rounded-md shadow-padrao max-w-md w-full p-6 transform transition-all duration-300 ${
          closing ? 'animate-fade-out' : 'animate-fade-in'
        }`}
      >
        <div className="flex justify-center mb-4">
          <div className="bg-red-500/20 p-3 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-2">
          {title}
        </h2>

        <p className="text-gray-300 text-center mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
