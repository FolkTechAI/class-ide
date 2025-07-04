import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import FileExplorer from "./components/FileExplorer";
import MonacoEditor from "./components/MonacoEditor";
import Terminal from "./components/Terminal";
import AIAgentPanel from "./components/AIAgentPanel";
import SettingsPanel from "./components/SettingsPanel";
import "./App.css";

function App() {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const handleFileSelect = (filePath: string, content: string) => {
    setActiveFile(filePath);
    setFileContent(content);
  };

  const handleContentChange = (newContent: string) => {
    setFileContent(newContent);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`app ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      {/* Top Menu Bar */}
      <div className="menu-bar">
        <div className="menu-items">
          <span className="menu-item">File</span>
          <span className="menu-item">Edit</span>
          <span className="menu-item">View</span>
          <span className="menu-item">AI</span>
          <span className="menu-item">Help</span>
        </div>
        <div className="menu-controls">
          <button onClick={() => setShowSettings(true)} className="settings-btn" title="Settings">
            ⚙️
          </button>
          <button onClick={toggleTheme} className="theme-toggle" title="Toggle Theme">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Main IDE Layout */}
      <div className="ide-layout">
        <PanelGroup direction="horizontal">
          {/* Left Sidebar - File Explorer */}
          <Panel defaultSize={20} minSize={15} maxSize={40}>
            <FileExplorer onFileSelect={handleFileSelect} />
          </Panel>
          
          <PanelResizeHandle className="resize-handle" />
          
          {/* Center - Editor and Terminal */}
          <Panel defaultSize={60} minSize={30}>
            <PanelGroup direction="vertical">
              {/* Editor */}
              <Panel defaultSize={70} minSize={30}>
                <MonacoEditor
                  content={fileContent}
                  onChange={handleContentChange}
                  activeFile={activeFile}
                  isDarkMode={isDarkMode}
                />
              </Panel>
              
              <PanelResizeHandle className="resize-handle" />
              
              {/* Terminal */}
              <Panel defaultSize={30} minSize={20}>
                <Terminal isDarkMode={isDarkMode} />
              </Panel>
            </PanelGroup>
          </Panel>
          
          <PanelResizeHandle className="resize-handle" />
          
          {/* Right Sidebar - AI Agent Panel */}
          <Panel defaultSize={20} minSize={15} maxSize={40}>
            <AIAgentPanel />
          </Panel>
        </PanelGroup>
      </div>

      {/* Settings Panel Overlay */}
      {showSettings && (
        <SettingsPanel 
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
