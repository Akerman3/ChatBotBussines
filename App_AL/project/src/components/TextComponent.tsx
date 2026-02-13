import React, { useState } from 'react';

interface TextComponentProps {
  content: string;
  fixedWidth: number;
  fixedHeight: number;
  onChange: (content: string) => void;
}

export function TextComponent({ content, fixedWidth, fixedHeight, onChange }: TextComponentProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <textarea
        value={content}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full border-2 border-blue-500 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        style={{
          width: `${fixedWidth}px`,
          height: `${fixedHeight}px`,
          overflowY: 'auto',
          overflowX: 'hidden',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          resize: 'none'
        }}
        placeholder="Haz clic para escribir..."
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className="w-full h-full border border-gray-300 rounded-lg p-2 cursor-text bg-white hover:bg-gray-50 transition-colors whitespace-pre-wrap break-words text-sm overflow-y-auto overflow-x-hidden"
      style={{
        width: `${fixedWidth}px`,
        height: `${fixedHeight}px`,
        wordWrap: 'break-word',
        overflowWrap: 'break-word'
      }}
    >
      {content || (
        <span className="text-gray-400 italic">Haz clic para escribir...</span>
      )}
    </div>
  );
}