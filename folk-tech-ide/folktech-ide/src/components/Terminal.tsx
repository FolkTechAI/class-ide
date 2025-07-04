import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import "./Terminal.css";
import { mcpFramework } from "../services/MCPFramework";
import { memorySystem } from "../services/MemorySystem";

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

  const executeCommand = async (command: string) => {
    const terminal = xtermRef.current;
    if (!terminal) return;

    const [cmd, ...args] = command.split(' ');

    try {
      switch (cmd.toLowerCase()) {
        case 'help':
          terminal.writeln('\x1b[1;36m📋 FolkTech IDE - AI-Native Terminal\x1b[0m');
          terminal.writeln('');
          terminal.writeln('\x1b[1;33m🤖 AI Commands:\x1b[0m');
          terminal.writeln('  \x1b[1;32mai generate\x1b[0m <prompt>   - Generate code or content');
          terminal.writeln('  \x1b[1;32mai validate\x1b[0m <code>     - Validate and review code');
          terminal.writeln('  \x1b[1;32mai debug\x1b[0m <error>      - Debug issues and errors');
          terminal.writeln('  \x1b[1;32mai status\x1b[0m             - Show AI system status');
          terminal.writeln('');
          terminal.writeln('\x1b[1;33m🔧 MCP Framework:\x1b[0m');
          terminal.writeln('  \x1b[1;32mmcp status\x1b[0m            - Show MCP framework status');
          terminal.writeln('  \x1b[1;32mmcp agents\x1b[0m            - List all agents');
          terminal.writeln('  \x1b[1;32mmcp tasks\x1b[0m             - Show task history');
          terminal.writeln('  \x1b[1;32mmcp clear\x1b[0m             - Clear task history');
          terminal.writeln('');
          terminal.writeln('\x1b[1;33m📄 .ftai Commands:\x1b[0m');
          terminal.writeln('  \x1b[1;32mftai parse\x1b[0m <content>   - Parse .ftai content');
          terminal.writeln('  \x1b[1;32mftai validate\x1b[0m <content> - Validate .ftai document');
          terminal.writeln('  \x1b[1;32mftai create\x1b[0m task <goal> - Create task template');
          terminal.writeln('');
          terminal.writeln('\x1b[1;33m💾 Memory System:\x1b[0m');
          terminal.writeln('  \x1b[1;32mmemory search\x1b[0m <query>  - Search memory entries');
          terminal.writeln('  \x1b[1;32mmemory stats\x1b[0m          - Show memory statistics');
          terminal.writeln('  \x1b[1;32mmemory clear\x1b[0m          - Clear old entries');
          terminal.writeln('');
          terminal.writeln('\x1b[1;33m⚡ System:\x1b[0m');
          terminal.writeln('  \x1b[1;32mclear\x1b[0m                 - Clear terminal');
          terminal.writeln('  \x1b[1;32mhelp\x1b[0m                  - Show this help');
          terminal.writeln('');
          break;

        case 'clear':
          terminal.clear();
          break;

        case 'ai':
        case 'mcp':
        case 'ftai':
          terminal.writeln('\x1b[33m🔄 Processing...\x1b[0m');
          
          const result = await mcpFramework.handleTerminalCommand(cmd, args);
          
          // Store the interaction in memory
          await memorySystem.storeAIInteraction(
            command,
            result,
            'terminal',
            cmd
          );
          
          // Format output with colors
          const lines = result.split('\n');
          for (const line of lines) {
            if (line.includes('[MOCK')) {
              terminal.writeln(`\x1b[33m${line}\x1b[0m`);
            } else if (line.includes('Error:') || line.includes('❌')) {
              terminal.writeln(`\x1b[31m${line}\x1b[0m`);
            } else if (line.includes('✅') || line.includes('Connected')) {
              terminal.writeln(`\x1b[32m${line}\x1b[0m`);
            } else if (line.includes('Model:') || line.includes('Agent:')) {
              terminal.writeln(`\x1b[36m${line}\x1b[0m`);
            } else {
              terminal.writeln(line);
            }
          }
          break;

        case 'memory':
          await handleMemoryCommand(args, terminal);
          break;

        case 'git':
          terminal.writeln(`\x1b[1;32mgit\x1b[0m ${args.join(' ')}`);
          terminal.writeln('\x1b[33m🔧 Git integration not yet implemented\x1b[0m');
          terminal.writeln('Coming in Phase 4: Full git workflow integration');
          break;

        case 'npm':
          terminal.writeln(`\x1b[1;32mnpm\x1b[0m ${args.join(' ')}`);
          terminal.writeln('\x1b[33m📦 NPM integration not yet implemented\x1b[0m');
          terminal.writeln('Coming in Phase 4: Package management integration');
          break;

        default:
          terminal.writeln(`\x1b[1;31mCommand not found:\x1b[0m ${cmd}`);
          terminal.writeln('Type \x1b[1;32mhelp\x1b[0m for available commands');
          break;
      }
    } catch (error) {
      terminal.writeln(`\x1b[1;31m❌ Error executing command:\x1b[0m ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Log error to memory system
      await memorySystem.storeLog('error', `Terminal command failed: ${command}`, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  const handleMemoryCommand = async (args: string[], terminal: XTerm) => {
    if (args.length === 0) {
      terminal.writeln('\x1b[1;33m💾 Memory System Commands:\x1b[0m');
      terminal.writeln('  \x1b[1;32mmemory search\x1b[0m <query>  - Search memory entries');
      terminal.writeln('  \x1b[1;32mmemory stats\x1b[0m          - Show memory statistics');
      terminal.writeln('  \x1b[1;32mmemory clear\x1b[0m          - Clear old entries (30+ days)');
      terminal.writeln('  \x1b[1;32mmemory export\x1b[0m         - Export all memories');
      return;
    }

    const subcommand = args[0];
    const remainingArgs = args.slice(1);

    try {
      switch (subcommand) {
        case 'search':
          if (remainingArgs.length === 0) {
            terminal.writeln('\x1b[31m❌ Usage:\x1b[0m memory search <query>');
            return;
          }
          
          terminal.writeln('\x1b[33m🔍 Searching memories...\x1b[0m');
          const searchResult = await memorySystem.search({
            query: remainingArgs.join(' '),
            limit: 10
          });
          
          terminal.writeln(`\x1b[32mFound ${searchResult.totalCount} matches:\x1b[0m`);
          terminal.writeln('');
          
          for (const entry of searchResult.entries) {
            terminal.writeln(`\x1b[36m📋 ${entry.title}\x1b[0m \x1b[90m(${entry.type})\x1b[0m`);
            terminal.writeln(`   ${entry.content.substring(0, 100)}...`);
            terminal.writeln(`   \x1b[90m📅 ${new Date(entry.timestamp).toLocaleString()}\x1b[0m`);
            terminal.writeln('');
          }
          break;

        case 'stats':
          terminal.writeln('\x1b[1;33m📊 Memory System Statistics:\x1b[0m');
          const stats = await memorySystem.getStats();
          terminal.writeln(`\x1b[32mTotal Memories:\x1b[0m ${stats.totalMemories}`);
          terminal.writeln('');
          terminal.writeln('\x1b[36mBy Type:\x1b[0m');
          Object.entries(stats.typeCounts).forEach(([type, count]) => {
            terminal.writeln(`  ${type}: \x1b[32m${count}\x1b[0m`);
          });
          break;

        case 'clear':
          terminal.writeln('\x1b[33m🧹 Clearing old memories (30+ days)...\x1b[0m');
          const deletedCount = await memorySystem.cleanupOldEntries(30);
          terminal.writeln(`\x1b[32m✅ Deleted ${deletedCount} old entries\x1b[0m`);
          break;

        case 'export':
          terminal.writeln('\x1b[33m📤 Exporting memories...\x1b[0m');
          await memorySystem.exportMemories();
          terminal.writeln('\x1b[32m✅ Export completed\x1b[0m (download functionality coming soon)');
          break;

        default:
          terminal.writeln(`\x1b[31m❌ Unknown memory subcommand:\x1b[0m ${subcommand}`);
          terminal.writeln('Type \x1b[1;32mmemory\x1b[0m for available commands');
          break;
      }
    } catch (error) {
      terminal.writeln(`\x1b[31m❌ Memory command failed:\x1b[0m ${error instanceof Error ? error.message : 'Unknown error'}`);
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