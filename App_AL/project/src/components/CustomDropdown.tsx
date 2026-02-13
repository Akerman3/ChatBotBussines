import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CustomDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CustomDropdown({ options, value, onChange, placeholder, className }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border rounded-md bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{value || placeholder}</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden min-w-full">
          <ul role="listbox" className="py-1">
            {options.map((option) => (
              <li
                key={option}
                role="option"
                aria-selected={option === value}
                onClick={() => handleOptionClick(option)}
                className={`px-3 py-2 cursor-pointer hover:bg-blue-50 hover:text-blue-700 ${
                  option === value ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-900'
                }`}
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}