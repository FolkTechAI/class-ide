import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import "./Terminal.css";

interface TerminalProps {
  isDarkMode: boolean;
}

const Terminal: React.FC<TerminalProps> = ({ isDarkMode }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (terminalRef.current) {
      initializeTerminal();
    }

    return () => {
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    // Update terminal theme when dark mode changes
    if (xtermRef.current) {
      xtermRef.current.options.theme = getTerminalTheme(isDarkMode);
    }
  }, [isDarkMode]);

  const getTerminalTheme = (darkMode: boolean) => {
    if (darkMode) {
      return {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#aeafad',
        black: '#000000',
        brightBlack: '#666666',
        red: '#f14c4c',
        brightRed: '#f14c4c',
        green: '#23d18b',
        brightGreen: '#23d18b',
        yellow: '#f5f543',
        brightYellow: '#f5f543',
        blue: '#3b8eea',
        brightBlue: '#3b8eea',
        magenta: '#d670d6',
        brightMagenta: '#d670d6',
        cyan: '#29b8db',
        brightCyan: '#29b8db',
        white: '#e5e5e5',
        brightWhite: '#e5e5e5',
      };
    } else {
      return {
        background: '#ffffff',
        foreground: '#333333',
        cursor: '#333333',
        black: '#000000',
        brightBlack: '#666666',
        red: '#cd3131',
        brightRed: '#cd3131',
        green: '#00bc00',
        brightGreen: '#00bc00',
        yellow: '#949800',
        brightYellow: '#949800',
        blue: '#0451a5',
        brightBlue: '#0451a5',
        magenta: '#bc05bc',
        brightMagenta: '#bc05bc',
        cyan: '#0598bc',
        brightCyan: '#0598bc',
        white: '#555555',
        brightWhite: '#555555',
      };
    }
  };

  const initializeTerminal = () => {
    const terminal = new XTerm({
      theme: getTerminalTheme(isDarkMode),
      fontSize: 14,
      fontFamily: "'Fira Code', 'Courier New', monospace",
      cursorBlink: true,
      allowTransparency: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    fitAddonRef.current = fitAddon;
    xtermRef.current = terminal;

    terminal.open(terminalRef.current!);
    fitAddon.fit();

    // Welcome message
    terminal.writeln('🚀 \x1b[1;36mFolkTech IDE Terminal\x1b[0m');
    terminal.writeln('');
    terminal.writeln('Connected to integrated terminal environment');
    terminal.writeln('AI agents and MCP protocols available');
    terminal.writeln('Type \x1b[1;32mhelp\x1b[0m for available commands');
    terminal.writeln('');
    
    // Setup command handling
    let currentLine = '';
    let commandHistory: string[] = [];
    let historyIndex = -1;

    const prompt = () => {
      terminal.write('\r\n\x1b[1;34m❯\x1b[0m ');
    };

    prompt();

    terminal.onData((data) => {
      const char = data.charCodeAt(0);

      if (char === 13) { // Enter
        terminal.write('\r\n');
        if (currentLine.trim()) {
          commandHistory.push(currentLine.trim());
          historyIndex = commandHistory.length;
          executeCommand(currentLine.trim());
        }
        currentLine = '';
        prompt();
      } else if (char === 127) { // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          terminal.write('\b \b');
        }
      } else if (char === 27) { // Escape sequences (arrow keys)
        // Handle arrow keys for command history
        if (data.length === 3) {
          if (data[1] === '[') {
            if (data[2] === 'A') { // Up arrow
              if (historyIndex > 0) {
                // Clear current line
                terminal.write('\r\x1b[K\x1b[1;34m❯\x1b[0m ');
                historyIndex--;
                currentLine = commandHistory[historyIndex];
                terminal.write(currentLine);
              }
            } else if (data[2] === 'B') { // Down arrow
              if (historyIndex < commandHistory.length - 1) {
                // Clear current line
                terminal.write('\r\x1b[K\x1b[1;34m❯\x1b[0m ');
                historyIndex++;
                currentLine = commandHistory[historyIndex];
                terminal.write(currentLine);
              }
            }
          }
        }
      } else if (char >= 32) { // Printable characters
        currentLine += data;
        terminal.write(data);
      }
    });

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  const executeCommand = (command: string) => {
    const terminal = xtermRef.current;
    if (!terminal) return;

    const [cmd, ...args] = command.split(' ');

    switch (cmd.toLowerCase()) {
      case 'help':
        terminal.writeln('Available commands:');
        terminal.writeln('  \x1b[1;32mhelp\x1b[0m           - Show this help message');
        terminal.writeln('  \x1b[1;32mclear\x1b[0m          - Clear the terminal');
        terminal.writeln('  \x1b[1;32mai\x1b[0m <query>     - Query AI agents');
        terminal.writeln('  \x1b[1;32mserena\x1b[0m <task>   - Interact with Serena orchestrator');
        terminal.writeln('  \x1b[1;32mftai\x1b[0m <file>     - Parse .ftai file');
        terminal.writeln('  \x1b[1;32mgit\x1b[0m <command>   - Execute git commands');
        terminal.writeln('  \x1b[1;32mnpm\x1b[0m <command>   - Execute npm commands');
        break;

      case 'clear':
        terminal.clear();
        break;

      case 'ai':
        if (args.length === 0) {
          terminal.writeln('\x1b[1;31mError:\x1b[0m Please provide a query for AI agents');
        } else {
          const query = args.join(' ');
          terminal.writeln(`\x1b[1;36mAI Query:\x1b[0m ${query}`);
          terminal.writeln('\x1b[33m[Serena]\x1b[0m Routing query to appropriate model...');
          // TODO: Implement actual AI query routing
          setTimeout(() => {
            terminal.writeln('\x1b[32m[Claude]\x1b[0m AI integration not yet implemented.');
            terminal.writeln('This will route to Claude Sonnet, GPT-4o, or Gemini based on task type.');
          }, 500);
        }
        break;

      case 'serena':
        terminal.writeln('\x1b[1;35m[Serena Orchestrator]\x1b[0m Initializing...');
        terminal.writeln('🤖 Serena task orchestration not yet implemented');
        terminal.writeln('Will handle: task validation, model routing, memory access');
        break;

      case 'ftai':
        if (args.length === 0) {
          terminal.writeln('\x1b[1;31mError:\x1b[0m Please specify a .ftai file to parse');
        } else {
          const filename = args[0];
          terminal.writeln(`\x1b[1;36mParsing:\x1b[0m ${filename}`);
          terminal.writeln('📄 .ftai parser not yet implemented');
          terminal.writeln('Will validate schema and extract @tags');
        }
        break;

      case 'git':
        terminal.writeln(`\x1b[1;32mgit\x1b[0m ${args.join(' ')}`);
        terminal.writeln('🔧 Git integration not yet implemented');
        break;

      case 'npm':
        terminal.writeln(`\x1b[1;32mnpm\x1b[0m ${args.join(' ')}`);
        terminal.writeln('📦 NPM integration not yet implemented');
        break;

      default:
        terminal.writeln(`\x1b[1;31mCommand not found:\x1b[0m ${cmd}`);
        terminal.writeln('Type \x1b[1;32mhelp\x1b[0m for available commands');
        break;
    }
  };

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="terminal-icon">⚡</span>
          <span>Terminal</span>
        </div>
        <div className="terminal-actions">
          <button className="terminal-btn" title="Split Terminal">⚡</button>
          <button className="terminal-btn" title="Kill Terminal">✕</button>
        </div>
      </div>
      <div ref={terminalRef} className="terminal-content" />
    </div>
  );
};

export default Terminal; 