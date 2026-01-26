# Character Sheet Integration

This project integrates a React-based character sheet from the DRD reference project into the TDT website.

## Setup

1. Install dependencies:
```bash
npm install
```

## Development

For development, you can use Vite's dev server:

```bash
npm run dev
```

This will start Vite's dev server which will serve the React app. The character sheet will be available when you click the "Open Character Sheet" button in the Rules tab.

## Production Build

To build the character sheet for production:

```bash
npm run build
```

This will create a `dist/character-sheet.js` file. Then update `index.html` to load the built bundle:

1. Comment out the development line:
```html
<!-- <script type="module" src="/src/main.tsx"></script> -->
```

2. Uncomment the production line:
```html
<script src="dist/character-sheet.js"></script>
```

## File Structure

- `src/components/CharacterSheet.tsx` - Main character sheet component
- `src/components/ui/` - UI components (DegreeInput, ProgressBar, ExpandableSection, Tooltip)
- `src/game/character/` - Game logic (CharacterSheetManager, data files)
- `src/lib/` - Utility functions
- `src/styles/globals.css` - Global styles and animations
- `src/main.tsx` - React entry point

## Integration

The character sheet is integrated into the Rules tab with a button that opens it. The React app is mounted to a `#character-sheet-root` div in the HTML, and the button in `js/dtd-interactive.js` calls `window.openCharacterSheet()` to open it.

