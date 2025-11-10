import React from 'react';
import { GeneratedHairstyle } from '../types';
import { Spinner } from './Spinner';

interface HairstyleGridProps {
  hairstyles: GeneratedHairstyle[];
  isLoading: boolean;
  loadingMessage: string;
  onImageClick: (imageUrl: string) => void;
}

interface HairstyleCardProps {
  hairstyle: GeneratedHairstyle;
  onClick: (imageUrl: string) => void;
}

const HairstyleCard: React.FC<HairstyleCardProps> = ({ hairstyle, onClick }) => (
    <button 
      className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 group transform transition-transform duration-300 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-opacity-75 text-left w-full"
      onClick={() => onClick(hairstyle.imageUrl)}
      aria-label={`View larger image for ${hairstyle.view}`}
    >
      <div className="aspect-square w-full bg-gray-100 flex items-center justify-center">
        <img src={hairstyle.imageUrl} alt={`${hairstyle.view} view`} className="w-full h-full object-cover" />
      </div>
      <div className="p-3">
        <h3 className="font-bold text-center text-lg text-gray-900">{hairstyle.view}</h3>
      </div>
    </button>
);

export const HairstyleGrid: React.FC<HairstyleGridProps> = ({ hairstyles, isLoading, loadingMessage, onImageClick }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full flex-grow">
        <Spinner className="animate-spin h-10 w-10 text-gray-800" />
        <p className="mt-4 text-lg text-gray-700 animate-pulse">{loadingMessage}</p>
      </div>
    );
  }

  if (hairstyles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full flex-grow text-gray-500">
        <p>Your generated hairstyles will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {hairstyles.map((style) => (
        <HairstyleCard key={style.view} hairstyle={style} onClick={onImageClick} />
      ))}
    </div>
  );
};