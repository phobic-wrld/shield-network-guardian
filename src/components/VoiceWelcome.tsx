import React, { useEffect, useState } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceWelcomeProps {
  onComplete?: () => void;
}

export const VoiceWelcome: React.FC<VoiceWelcomeProps> = ({ onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const startWelcomeSequence = async () => {
    // Check if we've already played on this session
    if (hasPlayed || sessionStorage.getItem('welcome-played')) {
      return;
    }

    // Show loading spinner first
    setIsLoading(true);
    
    // Wait for loading animation (3 seconds)
    setTimeout(() => {
      setIsLoading(false);
      playVoiceMessage();
    }, 3000);
  };

  const playVoiceMessage = async () => {
    try {
      setIsPlaying(true);
      
      // Create audio using Web Speech API
      const utterance = new SpeechSynthesisUtterance(
        "Update complete. Welcome to Shield Network Guardian. Your network protection is now active."
      );
      
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        setIsPlaying(false);
        setHasPlayed(true);
        sessionStorage.setItem('welcome-played', 'true');
        onComplete?.();
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setHasPlayed(true);
      };

      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.log('Voice synthesis not available');
      setIsPlaying(false);
      setHasPlayed(true);
    }
  };

  useEffect(() => {
    // Start the welcome sequence after a short delay
    const timer = setTimeout(() => {
      startWelcomeSequence();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading && !isPlaying) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-lg animate-fade-in">
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Initializing Shield Guardian...</span>
        </>
      ) : (
        <>
          <Shield className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-medium">Shield Guardian Activated</span>
        </>
      )}
    </div>
  );
};