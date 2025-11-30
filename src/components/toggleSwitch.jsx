
import React from 'react';

/**
 * Toggle Component - Botão de alternância reutilizável
 * 
 * @param {boolean} isOn - Estado atual do toggle (true = ligado, false = desligado)
 * @param {function} onToggle - Função callback chamada quando o toggle é clicado
 * @param {boolean} disabled - Se o toggle está desabilitado
 * @param {string} colorOn - Cor quando o toggle está ligado (padrão: 'bg-pistachio')
 * @param {string} colorOff - Cor quando o toggle está desligado (padrão: 'bg-gray-600')
 */
function ToggleSwitch({
  isOn,
  onToggle,
  disabled = false,
  colorOn = 'bg-pistachio',
  colorOff = 'bg-gray-600'
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-16 h-8 rounded-md transition-colors flex-shrink-0 ${
        isOn ? colorOn : colorOff
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      aria-pressed={isOn}
      role="switch"
    >
      <div
        className={`absolute top-1 w-6 h-6 bg-white rounded-md transition-all duration-200 ${
          isOn ? 'left-[calc(100%-1.75rem)]' : 'left-1'
        }`}
      />
    </button>
  );
}
export default ToggleSwitch