
import React from 'react';
import { GeneratedHairstyle, HairstyleSuggestion } from '../types';
import { Spinner } from './Spinner';

interface HairstyleGridProps {
  appState: 'start' | 'suggestions' | 'views';
  suggestions: HairstyleSuggestion[];
  views: GeneratedHairstyle[];
  isLoading: boolean;
  loadingMessage: string;
  onSuggestionClick: (suggestion: HairstyleSuggestion) => void;
  onViewClick: (imageUrl: string) => void;
}

const SuggestionCard: React.FC<{ suggestion: HairstyleSuggestion; onClick: (suggestion: HairstyleSuggestion) => void; }> = ({ suggestion, onClick }) => (
    <button 
      className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 group transform transition-transform duration-300 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-opacity-75 text-left w-full"
      onClick={() => onClick(suggestion)}
      aria-label={`Select hairstyle: ${suggestion.styleName}`}
    >
      <div className="aspect-square w-full bg-gray-100 flex items-center justify-center">
        <img src={suggestion.imageUrl} alt={`${suggestion.styleName} preview`} className="w-full h-full object-cover" />
      </div>
      <div className="p-3">
        <h3 className="font-bold text-center text-lg text-gray-900">{suggestion.styleName}</h3>
      </div>
    </button>
);

const ViewCard: React.FC<{ view: GeneratedHairstyle; onClick: (imageUrl: string) => void; }> = ({ view, onClick }) => (
    <button 
      className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 group transform transition-transform duration-300 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-opacity-75 text-left w-full"
      onClick={() => onClick(view.imageUrl)}
      aria-label={`View larger image for ${view.view}`}
    >
      <div className="aspect-square w-full bg-gray-100 flex items-center justify-center">
        <img src={view.imageUrl} alt={`${view.view} view`} className="w-full h-full object-cover" />
      </div>
      <div className="p-3">
        <h3 className="font-bold text-center text-lg text-gray-900">{view.view}</h3>
      </div>
    </button>
);


export const HairstyleGrid: React.FC<HairstyleGridProps> = ({ appState, suggestions, views, isLoading, loadingMessage, onSuggestionClick, onViewClick }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full flex-grow">
        <Spinner className="animate-spin h-10 w-10 text-gray-800" />
        <p className="mt-4 text-lg text-gray-700 animate-pulse">{loadingMessage}</p>
      </div>
    );
  }

  if (appState === 'start') {
    return (
      <div className="flex items-center justify-center h-full flex-grow text-gray-500">
        <p>Your generated hairstyles will appear here.</p>
      </div>
    );
  }
  
  if (appState === 'suggestions' && suggestions.length > 0) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {suggestions.map((suggestion) => (
          <SuggestionCard key={suggestion.styleName} suggestion={suggestion} onClick={onSuggestionClick} />
        ))}
      </div>
    );
  }

  if (appState === 'views') {
    return (
      <div className="grid grid-cols-2 gap-4">
        {views.map((view) => (
          <ViewCard key={view.view} view={view} onClick={onViewClick} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full flex-grow text-gray-500">
        <p>Your generated hairstyles will appear here.</p>
    </div>
  );
};
