
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { HairstyleGrid } from './components/HairstyleGrid';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { GeneratedHairstyle, HairstyleSuggestion } from './types';
import { analyzeFacialFeatures, suggestHairstyles, generateHairstyleImage, describeGeneratedHairstyle } from './services/geminiService';

export default function App() {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [appState, setAppState] = useState<'start' | 'suggestions' | 'views'>('start');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const [hairstyleSuggestions, setHairstyleSuggestions] = useState<HairstyleSuggestion[]>([]);
  const [selectedHairstyle, setSelectedHairstyle] = useState<HairstyleSuggestion | null>(null);
  const [generatedHairstyles, setGeneratedHairstyles] = useState<GeneratedHairstyle[]>([]);

  const handleImageUpload = (file: File) => {
    setUploadedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Reset everything on new image upload
    setAppState('start');
    setHairstyleSuggestions([]);
    setSelectedHairstyle(null);
    setGeneratedHairstyles([]);
    setError(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerateSuggestions = useCallback(async () => {
    if (!uploadedImage) {
      setError('Please upload an image first.');
      return;
    }

    setIsLoading(true);
    setAppState('suggestions');
    setError(null);
    setHairstyleSuggestions([]);

    try {
      const imageBase64 = await fileToBase64(uploadedImage);
      
      setLoadingMessage('Analyzing your facial features...');
      const facialFeatures = await analyzeFacialFeatures(imageBase64);
      
      setLoadingMessage('Dreaming up some new looks...');
      const hairstyleIdeas = await suggestHairstyles(facialFeatures);
      
      setLoadingMessage('Generating style previews...');
      const suggestionPromises = hairstyleIdeas.map(async (idea) => {
        const frontViewPrompt = `Generate a front view of this hairstyle: "${idea.description}". Apply it to the person in the image. The background must be pure white. Frame from shoulders up. Preserve exact facial features, skin tone, and head shape. Only change the hair.`;
        const imageUrl = await generateHairstyleImage(frontViewPrompt, imageBase64);
        return { ...idea, imageUrl };
      });

      const newSuggestions = await Promise.all(suggestionPromises);
      setHairstyleSuggestions(newSuggestions);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setAppState('start');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [uploadedImage]);
  
  const handleSelectHairstyle = useCallback(async (suggestion: HairstyleSuggestion) => {
    if (!uploadedImage) return;

    setSelectedHairstyle(suggestion);
    setAppState('views');
    setIsLoading(true);
    setError(null);
    setGeneratedHairstyles([]);

    try {
        const imageBase64 = await fileToBase64(uploadedImage);
        
        const frontViewImageUrl = suggestion.imageUrl;
        const initialViews: GeneratedHairstyle[] = [{ view: 'Front', imageUrl: frontViewImageUrl }];
        setGeneratedHairstyles(initialViews);
        
        setLoadingMessage('Ensuring style consistency...');
        const frontViewBase64 = frontViewImageUrl.split(',')[1];
        const consistentDescription = await describeGeneratedHairstyle(frontViewBase64);

        setLoadingMessage('Generating remaining views...');
        const remainingViews = ['Back', 'Left Side', 'Right Side'];
        const remainingViewPromises = remainingViews.map(async (view) => {
            let viewInstruction = '';
            const lowerCaseView = view.toLowerCase();

            if (lowerCaseView.includes('left side')) {
                viewInstruction = "This is the person's left profile view. The person should be turned to show the left side of their face, looking towards the right edge of the image.";
            } else if (lowerCaseView.includes('right side')) {
                viewInstruction = "This is the person's right profile view. The person should be turned to show the right side of their face, looking towards the left edge of the image.";
            } else if (lowerCaseView.includes('back')) {
                viewInstruction = "This is the back view of the person's head. Show the hairstyle from behind.";
            }

            const prompt = `Based on the front view, generate the ${lowerCaseView} of this hairstyle: "${consistentDescription}". Apply it to the person from the original photo. The background must be pure white. Frame from shoulders up. Preserve exact facial features, skin tone, and head shape. Only change the hair.`;

            const imageUrl = await generateHairstyleImage(prompt, imageBase64);
            return { view, imageUrl };
        });

        const remainingHairstyles = await Promise.all(remainingViewPromises);
        const allHairstyles = [...initialViews, ...remainingHairstyles];

        const finalHairstyles = allHairstyles.sort((a, b) => {
            const order = ['Front', 'Back', 'Left Side', 'Right Side'];
            return order.indexOf(a.view) - order.indexOf(b.view);
        });
        setGeneratedHairstyles(finalHairstyles);
        
    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An error occurred generating views.');
        setAppState('suggestions');
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [uploadedImage]);
  
  const handleGoBack = () => {
    setAppState('suggestions');
    setGeneratedHairstyles([]);
    setSelectedHairstyle(null);
    setError(null);
  };

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
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">1. Upload Your Photo</h2>
            <ImageUploader onImageUpload={handleImageUpload} imagePreview={imagePreview} />
            <button
              onClick={handleGenerateSuggestions}
              disabled={isLoading || !uploadedImage || appState !== 'start'}
              className="mt-6 w-full bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-opacity-75"
            >
              {isLoading && appState === 'suggestions' ? 'Generating...' : '2. Generate Hairstyles'}
            </button>
            {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 flex flex-col min-h-[500px]">
            {appState === 'views' && selectedHairstyle && (
              <div className="mb-4">
                <button onClick={handleGoBack} className="text-sm text-gray-600 hover:text-gray-900 font-medium mb-1 flex items-center gap-1 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Back to Suggestions
                </button>
                <h2 className="text-2xl font-bold text-gray-900">{selectedHairstyle.styleName}</h2>
              </div>
            )}

            {(appState === 'suggestions' && !isLoading) && (
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Choose Your Favorite Look</h2>
            )}

            {appState === 'start' && (
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Your New Look</h2>
            )}
            
            <HairstyleGrid 
              appState={appState}
              suggestions={hairstyleSuggestions}
              views={generatedHairstyles}
              isLoading={isLoading} 
              loadingMessage={loadingMessage}
              onSuggestionClick={handleSelectHairstyle}
              onViewClick={handleImagePreview}
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
