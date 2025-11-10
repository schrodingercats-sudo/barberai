
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './UploadIcon';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  imagePreview: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imagePreview }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onImageUpload(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [onImageUpload]);

  return (
    <div 
      className={`w-full aspect-square border-2 border-dashed rounded-lg p-4 flex flex-col justify-center items-center text-center cursor-pointer transition-colors duration-300 ${isDragging ? 'border-gray-900 bg-gray-100' : 'border-gray-300 hover:border-gray-500'}`}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
      />
      {imagePreview ? (
        <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" />
      ) : (
        <div className="text-gray-500">
          <UploadIcon className="w-16 h-16 mx-auto mb-2" />
          <p className="font-semibold">Click to upload or drag & drop</p>
          <p className="text-sm">PNG, JPG, or WEBP</p>
        </div>
      )}
    </div>
  );
};