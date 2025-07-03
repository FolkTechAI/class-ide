import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import "./MonacoEditor.css";

interface MonacoEditorProps {
  content: string;
  onChange: (value: string) => void;
  activeFile: string | null;
  isDarkMode: boolean;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({ 
  content, 
  onChange, 
  activeFile, 
  isDarkMode 
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    // Register .ftai language when Monaco loads
    if (monaco.languages) {
      registerFtaiLanguage();
    }
  }, []);

  const registerFtaiLanguage = () => {
    // Register .ftai language
    monaco.languages.register({ id: 'ftai' });

    // Define .ftai syntax highlighting
    monaco.languages.setMonarchTokensProvider('ftai', {
      tokenizer: {
        root: [
          // FTAI tags (e.g., @ftai, @document, @task)
          [/@[a-zA-Z_][a-zA-Z0-9_]*/, 'ftai-tag'],
          
          // FTAI version
          [/v\d+\.\d+/, 'ftai-version'],
          
          // Comments (lines starting with #)
          [/#.*$/, 'comment'],
          
          // Strings
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string'],
          
          // Keywords for common FTAI fields
          [/\b(title|author|schema|tags|status|description|goal|stack|language|framework)\b/, 'keyword'],
          
          // Values in brackets
          [/\[.*?\]/, 'ftai-array'],
          
          // Separators
          [/---/, 'ftai-separator'],
          [/@end/, 'ftai-end'],
        ],
        
        string: [
          [/[^\\"]+/, 'string'],
          [/"/, 'string', '@pop']
        ]
      }
    });

    // Define .ftai theme
    monaco.editor.defineTheme('ftai-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'ftai-tag', foreground: '#4FC1FF', fontStyle: 'bold' },
        { token: 'ftai-version', foreground: '#FFAB40' },
        { token: 'ftai-array', foreground: '#C792EA' },
        { token: 'ftai-separator', foreground: '#676E95', fontStyle: 'bold' },
        { token: 'ftai-end', foreground: '#F78C6C', fontStyle: 'bold' },
        { token: 'keyword', foreground: '#C3E88D' },
        { token: 'comment', foreground: '#546E7A', fontStyle: 'italic' },
      ],
      colors: {}
    });

    monaco.editor.defineTheme('ftai-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'ftai-tag', foreground: '#1976D2', fontStyle: 'bold' },
        { token: 'ftai-version', foreground: '#F57C00' },
        { token: 'ftai-array', foreground: '#7B1FA2' },
        { token: 'ftai-separator', foreground: '#424242', fontStyle: 'bold' },
        { token: 'ftai-end', foreground: '#D84315', fontStyle: 'bold' },
        { token: 'keyword', foreground: '#388E3C' },
        { token: 'comment', foreground: '#616161', fontStyle: 'italic' },
      ],
      colors: {}
    });
  };

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    
         // Add AI completion provider for .ftai files
     monaco.languages.registerCompletionItemProvider('ftai', {
       provideCompletionItems: (model, position) => {
         const word = model.getWordUntilPosition(position);
         const range = {
           startLineNumber: position.lineNumber,
           endLineNumber: position.lineNumber,
           startColumn: word.startColumn,
           endColumn: word.endColumn
         };

         const suggestions = [
           {
             label: '@ftai',
             kind: monaco.languages.CompletionItemKind.Snippet,
             insertText: '@ftai v2.0',
             documentation: 'FTAI document header',
             range: range
           },
           {
             label: '@document',
             kind: monaco.languages.CompletionItemKind.Snippet,
             insertText: '@document\ntitle: \nauthor: \nschema: \ntags: []\n@end',
             documentation: 'Document metadata block',
             range: range
           },
           {
             label: '@task',
             kind: monaco.languages.CompletionItemKind.Snippet,
             insertText: '@task\ndescription: \nstatus: \n@end',
             documentation: 'Task definition block',
             range: range
           },
           {
             label: '@ai_note',
             kind: monaco.languages.CompletionItemKind.Snippet,
             insertText: '@ai_note\n\n@end',
             documentation: 'AI-specific note block',
             range: range
           }
         ];
         
         return { suggestions };
       }
     });
  };

  const getLanguage = (filename: string | null): string => {
    if (!filename) return 'plaintext';
    
    const ext = filename.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'ftai': return 'ftai';
      case 'ts': case 'tsx': return 'typescript';
      case 'js': case 'jsx': return 'javascript';
      case 'py': return 'python';
      case 'md': return 'markdown';
      case 'json': return 'json';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'swift': return 'swift';
      default: return 'plaintext';
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  return (
    <div className="monaco-editor-container">
      {activeFile && (
        <div className="editor-tab">
          <span className="tab-icon">
            {activeFile.endsWith('.ftai') ? '🤖' : '📄'}
          </span>
          <span className="tab-name">{activeFile.split('/').pop()}</span>
          <button className="tab-close">×</button>
        </div>
      )}
      
      <div className="editor-wrapper">
        {activeFile ? (
          <Editor
            height="100%"
            language={getLanguage(activeFile)}
            value={content}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme={isDarkMode ? 'ftai-dark' : 'ftai-light'}
                         options={{
               fontSize: 14,
               fontFamily: "'Fira Code', 'Courier New', monospace",
               minimap: { enabled: true },
               wordWrap: 'on',
               automaticLayout: true,
               scrollBeyondLastLine: false,
               renderWhitespace: 'selection',
               suggest: {
                 showSnippets: true,
               },
             }}
          />
        ) : (
          <div className="editor-placeholder">
            <div className="placeholder-content">
              <h2>🚀 FolkTech IDE</h2>
              <p>Select a file to start editing</p>
              <div className="placeholder-features">
                <div className="feature">
                  <span className="feature-icon">🤖</span>
                  <span>AI-Native .ftai Support</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">⚡</span>
                  <span>Monaco Editor Engine</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🎯</span>
                  <span>Multi-Model AI Integration</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonacoEditor; 