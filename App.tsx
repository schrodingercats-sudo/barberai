import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { HairstyleGrid } from './components/HairstyleGrid';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { GeneratedHairstyle } from './types';
import { analyzeFacialFeatures, suggestHairstyle, generateHairstyleImage, describeGeneratedHairstyle } from './services/geminiService';

export default function App() {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatedHairstyles, setGeneratedHairstyles] = useState<GeneratedHairstyle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageUpload = (file: File) => {
    setUploadedImage(file);
    setGeneratedHairstyles([]);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // remove data:image/...;base64, prefix
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };
  
  const handleGenerate = useCallback(async () => {
    if (!uploadedImage) {
      setError('Please upload an image first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedHairstyles([]);
    
    try {
      const imageBase64 = await fileToBase64(uploadedImage);
      
      setLoadingMessage('Analyzing your facial features...');
      const facialFeatures = await analyzeFacialFeatures(imageBase64);
      
      setLoadingMessage('Thinking of the perfect hairstyle...');
      const initialHairstyleDescription = await suggestHairstyle(facialFeatures);
      
      const newHairstyles: GeneratedHairstyle[] = [];
      
      // Step 1: Generate the front view first to act as the "source of truth"
      setLoadingMessage('Generating Front view...');
      const frontViewInstruction = "This is the front view of the person. They should be looking directly forward.";
      const frontViewPrompt = `Apply this new hairstyle to the person in the image: "${initialHairstyleDescription}". ${frontViewInstruction} The background must be pure white. Frame the image from the shoulders up to ensure the full hairstyle is visible. It is crucial to preserve the person's exact facial features, skin tone, and head shape from the original photo. Only change the hair and ensure the new hairstyle seamlessly integrates with the person's head.`;
      const frontViewImageUrl = await generateHairstyleImage(frontViewPrompt, imageBase64);
      newHairstyles.push({ view: 'Front', imageUrl: frontViewImageUrl });
      setGeneratedHairstyles([...newHairstyles]); // Update UI immediately with the front view

      // Step 2: Analyze the generated front view to create a visually consistent description
      setLoadingMessage('Ensuring style consistency...');
      const frontViewBase64 = frontViewImageUrl.split(',')[1];
      const consistentDescription = await describeGeneratedHairstyle(frontViewBase64);

      // Step 3: Generate the remaining views in parallel using the new consistent description
      setLoadingMessage('Generating remaining views...');
      const remainingViews = ['Back', 'Left Side', 'Right Side'];

      const remainingViewPromises = remainingViews.map(async (view) => {
          let viewInstruction = '';
          const lowerCaseView = view.toLowerCase();

          if (lowerCaseView.includes('left side')) {
              viewInstruction = "This is the person's left profile view. Show the hairstyle from the left side.";
          } else if (lowerCaseView.includes('right side')) {
              viewInstruction = "This is the person's right profile view. Show the hairstyle from the right side.";
          } else if (lowerCaseView.includes('back')) {
              viewInstruction = "This is the back view of the person's head. Show the hairstyle from behind.";
          }

          const prompt = `Apply this new hairstyle to the person in the image: "${consistentDescription}". ${viewInstruction} The background must be pure white. Frame the image from the shoulders up to ensure the full hairstyle is visible. It is crucial to preserve the person's exact facial features, skin tone, and head shape from the original photo. Only change the hair and ensure the new hairstyle seamlessly integrates with the person's head.`;

          const imageUrl = await generateHairstyleImage(prompt, imageBase64);
          return { view, imageUrl };
      });

      const remainingHairstyles = await Promise.all(remainingViewPromises);
      // Sort to ensure a consistent order
      const finalHairstyles = [...newHairstyles, ...remainingHairstyles].sort((a, b) => {
        const order = ['Front', 'Back', 'Left Side', 'Right Side'];
        return order.indexOf(a.view) - order.indexOf(b.view);
      });
      setGeneratedHairstyles(finalHairstyles);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [uploadedImage]);

  const handleImagePreview = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleClosePreview = () => {
    setSelectedImage(null);
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">1. Upload Your Photo</h2>
            <ImageUploader onImageUpload={handleImageUpload} imagePreview={imagePreview} />
            <button
              onClick={handleGenerate}
              disabled={isLoading || !uploadedImage}
              className="mt-6 w-full bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-opacity-75"
            >
              {isLoading ? 'Generating...' : '2. Generate Hairstyles'}
            </button>
            {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Your New Look</h2>
            <HairstyleGrid 
              hairstyles={generatedHairstyles} 
              isLoading={isLoading} 
              loadingMessage={loadingMessage}
              onImageClick={handleImagePreview}
            />
          </div>
        </div>
      </main>
      {selectedImage && (
        <ImagePreviewModal imageUrl={selectedImage} onClose={handleClosePreview} />
      )}
    </div>
  );
}