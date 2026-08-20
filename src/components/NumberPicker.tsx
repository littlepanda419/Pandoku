import React from "react";

interface NumberPickerProps {
  onSelectNumber: (num: number) => void;
}

export const NumberPicker: React.FC<NumberPickerProps> = ({
  onSelectNumber,
}) => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const handleDragStart = (e: React.DragEvent, num: number) => {
    e.dataTransfer.setData("text/plain", num.toString());
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="flex flex-col gap-2">
      {numbers.map((num) => (
        <div
          key={num}
          draggable
          onDragStart={(e) => handleDragStart(e, num)}
          onClick={() => onSelectNumber(num)}
          className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center btn-accent text-white font-bold text-xl rounded-xl shadow-md cursor-grab active:cursor-grabbing active:scale-95 transition-all select-none"
        >
          {num}
        </div>
      ))}
    </div>
  );
};
