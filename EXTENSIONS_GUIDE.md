# Extensions System Guide

## How It Works

The extension system provides real functionality that integrates with the Monaco code editor, similar to how VS Code extensions work.

## Installation Process

1. **Browse Extensions**: Click the "Add Extensions" button in the terminal or use the extensions status indicator
2. **Install**: Click "Install" on any extension - this simulates a real installation process
3. **Activation**: Extensions are automatically enabled after installation
4. **Real Features**: Extensions provide actual functionality in the code editor

## Available Extensions & Features

### 🤖 GitHub Copilot (`github.copilot`)
**Real Features:**
- AI-powered code completions
- Inline suggestions (ghost text)
- Context-aware code generation
- Supports multiple languages

**How to Test:**
1. Install GitHub Copilot extension
2. Open `demo.ts` or `demo.py` file
3. Start typing code - you'll see AI suggestions
4. Press `Ctrl+I` to trigger inline suggestions manually
5. Accept suggestions with `Tab` or `Enter`

### 🐍 Python (`ms-python.python`)
**Real Features:**
- Enhanced Python completions (def, class, if __name__)
- Hover documentation for built-in functions
- Python-specific snippets
- Function and class templates

**How to Test:**
1. Install Python extension
2. Open `demo.py` file
3. Type `def` and see function template suggestions
4. Hover over `print`, `len`, `range` to see documentation
5. Try typing `class` for class templates

### 💅 Prettier (`esbenp.prettier-vscode`)
**Real Features:**
- Document formatting for JS/TS/CSS
- Range formatting (format selection)
- Automatic code style fixes
- Consistent indentation and spacing

**How to Test:**
1. Install Prettier extension
2. Open `demo.js` or `styles.css`
3. Mess up the formatting (remove spaces, wrong indentation)
4. Press `Alt+Shift+F` to format the entire document
5. Select code and format just that range

### 📘 TypeScript (`ms-vscode.vscode-typescript-next`)
**Real Features:**
- Enhanced TypeScript/JavaScript support
- Better IntelliSense
- Type checking
- Import suggestions

**How to Test:**
1. Pre-installed and enabled
2. Open `demo.ts` file
3. See type hints and IntelliSense
4. Try typing object properties for autocompletion

## Technical Implementation

### Extension Runtime
- Extensions register providers with Monaco editor
- Real completion providers, hover providers, formatting providers
- Proper activation/deactivation lifecycle
- Context-aware feature activation

### Code Editor Integration
- Monaco editor configured for extension support
- Inline suggestions enabled
- Keyboard shortcuts for extension features
- Visual indicators for active extensions

### Persistence
- Extension state saved to localStorage
- Installations persist across sessions
- Enable/disable state maintained

## Demo Files

Test extensions with these demo files:
- `demo.py` - Python features
- `demo.ts` - TypeScript + Copilot features  
- `demo.js` - JavaScript features
- `demo.json` - JSON language support
- `styles.css` - CSS formatting

## Keyboard Shortcuts

- `Ctrl+I` - Trigger inline suggestions
- `Alt+Shift+F` - Format document
- `Ctrl+Space` - Trigger completions
- `Tab` - Accept inline suggestion
- `Escape` - Dismiss suggestions

## Extension Status

- **Blue badge with robot icon**: Copilot active
- **Purple badge with lightning**: Prettier active  
- **Green badge with snake**: Python active
- **Extensions counter**: Shows number of enabled extensions

## Real vs Simulated

**Real Features:**
- Code completions and suggestions
- Document formatting
- Hover documentation
- Syntax highlighting enhancements
- Keyboard shortcuts

**Simulated Features:**
- Extension marketplace (uses mock data)
- Installation process (no actual files downloaded)
- Extension descriptions and metadata

This creates a realistic extension experience that demonstrates how a real IDE extension system would work!