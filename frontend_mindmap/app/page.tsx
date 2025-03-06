'use client';

import React from 'react';
import MindMap from './components/MindMap';
import { LearningProvider } from './context/LearningContext';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-white">Interactive Learning Mind Map</h1>
          <p className="text-white/80">
            Explore concepts, answer questions, and track your learning progress
          </p>
        </div>
      </header>
      <div className="bg-yellow-200 p-4 text-center">
        <p className="font-bold">Test Banner - Outside LearningProvider</p>
        <p>This text should always be visible regardless of LearningProvider rendering</p>
      </div>
      <div className="flex-1 w-full h-[calc(100vh-8rem)]">
        
        <LearningProvider>
          <MindMap />
        </LearningProvider>
      </div>
      
      <footer className="bg-gray-800 text-white/80 text-center py-3 text-sm">
        <p>Interactive Mind Map Learning Tool</p>
      </footer>
    </main>
  );
}
