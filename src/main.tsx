import React from 'react';
import ReactDOM from 'react-dom/client';
import CharacterSheet from './components/CharacterSheet';
import './styles/globals.css';

// Global state for character sheet visibility
let setCharacterSheetOpen: ((open: boolean) => void) | null = null;

// Function to open character sheet from external JavaScript
(window as any).openCharacterSheet = function() {
  if (setCharacterSheetOpen) {
    setCharacterSheetOpen(true);
  }
};

// Function to close character sheet from external JavaScript
(window as any).closeCharacterSheet = function() {
  if (setCharacterSheetOpen) {
    setCharacterSheetOpen(false);
  }
};

function App() {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Expose setter to global scope
  React.useEffect(() => {
    setCharacterSheetOpen = setIsOpen;
    return () => {
      setCharacterSheetOpen = null;
    };
  }, []);

  return (
    <CharacterSheet
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    />
  );
}

// Mount React app to a dedicated container
const container = document.getElementById('character-sheet-root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  // Create container if it doesn't exist
  const newContainer = document.createElement('div');
  newContainer.id = 'character-sheet-root';
  document.body.appendChild(newContainer);
  const root = ReactDOM.createRoot(newContainer);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

