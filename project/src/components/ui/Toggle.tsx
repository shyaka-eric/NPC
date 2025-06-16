import React from 'react';

interface ToggleProps {
  label: string;
  isChecked: boolean;
  onChange: () => void;
}

const Toggle: React.FC<ToggleProps> = ({ label, isChecked, onChange }) => {
  return (
    <div className="flex items-center">
      <span className="mr-2 text-sm font-medium text-gray-700">{label}</span>
      <button
        onClick={onChange}
        className={`w-10 h-6 flex items-center rounded-full p-1 ${
          isChecked ? 'bg-blue-500' : 'bg-gray-300'
        }`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full shadow-md transform ${
            isChecked ? 'translate-x-4' : 'translate-x-0'
          }`}
        ></div>
      </button>
    </div>
  );
};

export default Toggle;
