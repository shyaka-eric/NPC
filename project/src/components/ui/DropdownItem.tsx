import React from 'react';

interface DropdownItemProps {
  onClick: () => void;
  children: React.ReactNode;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      role="menuitem"
    >
      {children}
    </button>
  );
};

export default DropdownItem; 