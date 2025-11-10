import React, { useEffect } from 'react';

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview"
    >
      <div 
        className="relative w-auto h-auto max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()} 
      >
        <img src={imageUrl} alt="Hairstyle Preview" className="block max-w-full max-h-[90vh] rounded-lg object-contain" />
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 sm:-top-4 sm:-right-4 text-white bg-gray-900 rounded-full p-2 hover:bg-gray-700 transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close image preview"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};