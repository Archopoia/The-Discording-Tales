import React from 'react';
import ReactDOM from 'react-dom/client';
import CharacterSheet from './components/CharacterSheet';
import './styles/globals.css';

function App() {
  return <CharacterSheet embedded />;
}

const container = document.getElementById('character-sheet-root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  const newContainer = document.createElement('div');
  newContainer.id = 'character-sheet-root';
  newContainer.className = 'play-character-sheet-root';
  const play = document.getElementById('play');
  (play ?? document.body).appendChild(newContainer);
  const root = ReactDOM.createRoot(newContainer);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
