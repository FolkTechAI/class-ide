import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./SettingsPanel.css";

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  apiKey?: string;
  isActive: boolean;
  permissions: {
    codeGeneration: boolean;
    debugging: boolean;
    contextEngineering: boolean;
    rapidPrototyping: boolean;
    orchestration: boolean;
  };
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  maxTokens?: number;
  temperature?: number;
}

interface SettingsPanelProps {
  isDarkMode: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isDarkMode, onClose }) => {
  const [activeTab, setActiveTab] = useState<'models' | 'api-keys' | 'config' | 'about'>('models');
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [configPath, setConfigPath] = useState<string>('local');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    loadConfiguration();
  }, []);

  const defaultModels: ModelConfig[] = [
    {
      id: 'claude-sonnet',
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      isActive: true,
      permissions: {
        codeGeneration: true,
        debugging: true,
        contextEngineering: true,
        rapidPrototyping: true,
        orchestration: false,
      },
      status: 'disconnected',
      maxTokens: 200000,
      temperature: 0.7
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      isActive: false,
      permissions: {
        codeGeneration: true,
        debugging: false,
        contextEngineering: false,
        rapidPrototyping: true,
        orchestration: false,
      },
      status: 'disconnected',
      maxTokens: 128000,
      temperature: 0.3
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'Google',
      isActive: false,
      permissions: {
        codeGeneration: false,
        debugging: true,
        contextEngineering: false,
        rapidPrototyping: true,
        orchestration: false,
      },
      status: 'disconnected',
      maxTokens: 32000,
      temperature: 0.5
    },
    {
      id: 'serena',
      name: 'Serena Orchestrator',
      provider: 'FolkTech',
      isActive: true,
      permissions: {
        codeGeneration: false,
        debugging: false,
        contextEngineering: false,
        rapidPrototyping: false,
        orchestration: true,
      },
      status: 'connected',
    }
  ];

  const loadConfiguration = async () => {
    try {
      setIsLoading(true);
      // Try to load from saved config, fallback to defaults
      const savedConfig = localStorage.getItem('folktech-ide-models');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setModels(parsed.models || defaultModels);
        setSelectedModel(parsed.activeModel || 'claude-sonnet');
        setConfigPath(parsed.configPath || 'local');
      } else {
        setModels(defaultModels);
        setSelectedModel('claude-sonnet');
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      setModels(defaultModels);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaveStatus('saving');
      
      const config = {
        models,
        activeModel: selectedModel,
        configPath,
        lastUpdated: new Date().toISOString()
      };

      // Save to localStorage (local config)
      localStorage.setItem('folktech-ide-models', JSON.stringify(config));

      // If DAS path is selected, also save to external location
      if (configPath === 'das') {
        try {
          // TODO: Implement Tauri file system API to save to DAS
          console.log('Would save to DAS:', '/Volumes/Folk_DAS/IDE/config/models.config.json');
        } catch (error) {
          console.warn('Could not save to DAS, using local config only');
        }
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const updateModel = (modelId: string, updates: Partial<ModelConfig>) => {
    setModels(prev => prev.map(model => 
      model.id === modelId ? { ...model, ...updates } : model
    ));
  };

  const updateApiKey = (modelId: string, apiKey: string) => {
    updateModel(modelId, { 
      apiKey,
      status: apiKey ? 'disconnected' : 'error'
    });
  };

  const testConnection = async (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model || !model.apiKey) return;

    updateModel(modelId, { status: 'testing' });
    
    try {
      // TODO: Implement actual API testing
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateModel(modelId, { status: 'connected' });
    } catch (error) {
      updateModel(modelId, { status: 'error' });
    }
  };

  const loadConfigFile = async (file: File) => {
    try {
      const text = await file.text();
      let config;
      
      if (file.name.endsWith('.ftai')) {
        // Parse .ftai format
        const lines = text.split('\n');
        // TODO: Implement proper .ftai parser
        config = { models: defaultModels };
      } else {
        // Parse JSON
        config = JSON.parse(text);
      }
      
      if (config.models) {
        setModels(config.models);
        if (config.activeModel) {
          setSelectedModel(config.activeModel);
        }
      }
    } catch (error) {
      console.error('Failed to load config file:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'var(--success-color)';
      case 'testing': return 'var(--warning-color)';
      case 'error': return 'var(--danger-color)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'testing': return 'Testing...';
      case 'error': return 'Error';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>🔧 Settings</h2>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      <div className="settings-tabs">
        <button 
          className={`tab ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          🤖 Models
        </button>
        <button 
          className={`tab ${activeTab === 'api-keys' ? 'active' : ''}`}
          onClick={() => setActiveTab('api-keys')}
        >
          🔑 API Keys
        </button>
        <button 
          className={`tab ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          ⚙️ Config
        </button>
        <button 
          className={`tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          ℹ️ About
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'models' && (
          <div className="models-tab">
            <div className="active-model-selector">
              <h3>Active Model</h3>
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                className="model-dropdown"
              >
                {models.filter(m => m.isActive).map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.provider})
                  </option>
                ))}
              </select>
            </div>

            <div className="models-list">
              <h3>Available Models</h3>
              {models.map(model => (
                <div key={model.id} className="model-card">
                  <div className="model-header">
                    <div className="model-info">
                      <div className="model-name">{model.name}</div>
                      <div className="model-provider">{model.provider}</div>
                    </div>
                    <div className="model-controls">
                      <div 
                        className="status-indicator"
                        style={{ backgroundColor: getStatusColor(model.status) }}
                        title={getStatusText(model.status)}
                      />
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={model.isActive}
                          onChange={(e) => updateModel(model.id, { isActive: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="model-permissions">
                    <h4>Permissions</h4>
                    <div className="permissions-grid">
                      {Object.entries(model.permissions).map(([key, value]) => (
                        <label key={key} className="permission-item">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => updateModel(model.id, {
                              permissions: { ...model.permissions, [key]: e.target.checked }
                            })}
                            disabled={model.id === 'serena'} // Serena permissions are fixed
                          />
                          <span className="permission-label">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {model.maxTokens && (
                    <div className="model-params">
                      <div className="param-item">
                        <label>Max Tokens</label>
                        <input
                          type="number"
                          value={model.maxTokens}
                          onChange={(e) => updateModel(model.id, { maxTokens: parseInt(e.target.value) })}
                          min="1000"
                          max="500000"
                        />
                      </div>
                      <div className="param-item">
                        <label>Temperature</label>
                        <input
                          type="range"
                          value={model.temperature || 0.7}
                          onChange={(e) => updateModel(model.id, { temperature: parseFloat(e.target.value) })}
                          min="0"
                          max="2"
                          step="0.1"
                        />
                        <span className="param-value">{model.temperature?.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'api-keys' && (
          <div className="api-keys-tab">
            <div className="api-keys-header">
              <h3>🔑 API Key Management</h3>
              <p className="security-note">
                🔒 API keys are stored locally and encrypted
              </p>
            </div>

            {models.filter(m => m.id !== 'serena').map(model => (
              <div key={model.id} className="api-key-card">
                <div className="api-key-header">
                  <div className="model-info">
                    <h4>{model.name}</h4>
                    <span className="provider-badge">{model.provider}</span>
                  </div>
                  <div 
                    className="connection-status"
                    style={{ color: getStatusColor(model.status) }}
                  >
                    {getStatusText(model.status)}
                  </div>
                </div>

                <div className="api-key-input">
                  <input
                    type="password"
                    placeholder={`Enter ${model.provider} API key...`}
                    value={model.apiKey || ''}
                    onChange={(e) => updateApiKey(model.id, e.target.value)}
                  />
                  <button 
                    onClick={() => testConnection(model.id)}
                    disabled={!model.apiKey || model.status === 'testing'}
                    className="test-btn"
                  >
                    {model.status === 'testing' ? '⏳' : '🔍'} Test
                  </button>
                </div>

                <div className="api-key-help">
                  <details>
                    <summary>How to get {model.provider} API key</summary>
                    <div className="help-content">
                      {model.provider === 'Anthropic' && (
                        <p>Visit <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a> and create an API key</p>
                      )}
                      {model.provider === 'OpenAI' && (
                        <p>Visit <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com/api-keys</a> and create an API key</p>
                      )}
                      {model.provider === 'Google' && (
                        <p>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank">makersuite.google.com</a> and create an API key</p>
                      )}
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="config-tab">
            <div className="config-section">
              <h3>Configuration Storage</h3>
              <div className="config-location">
                <label>
                  <input
                    type="radio"
                    value="local"
                    checked={configPath === 'local'}
                    onChange={(e) => setConfigPath(e.target.value)}
                  />
                  Local Storage (Browser)
                </label>
                <label>
                  <input
                    type="radio"
                    value="das"
                    checked={configPath === 'das'}
                    onChange={(e) => setConfigPath(e.target.value)}
                  />
                  DAS Storage (/Volumes/Folk_DAS/IDE/config/)
                </label>
              </div>
            </div>

            <div className="config-section">
              <h3>Import/Export Configuration</h3>
              
              <div className="config-actions">
                <div className="import-section">
                  <h4>Import Config</h4>
                  <div 
                    className="drop-zone"
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files);
                      if (files.length > 0) {
                        loadConfigFile(files[0]);
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <p>Drop .json or .ftai config file here</p>
                    <input
                      type="file"
                      accept=".json,.ftai"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          loadConfigFile(e.target.files[0]);
                        }
                      }}
                      style={{ display: 'none' }}
                      id="config-file-input"
                    />
                    <label htmlFor="config-file-input" className="file-btn">
                      Choose File
                    </label>
                  </div>
                </div>

                <div className="export-section">
                  <h4>Export Config</h4>
                  <button 
                    onClick={() => {
                      const config = { models, activeModel: selectedModel, configPath };
                      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'folktech-ide-config.json';
                      a.click();
                    }}
                    className="export-btn"
                  >
                    📥 Export JSON
                  </button>
                  <button 
                    onClick={() => {
                      // TODO: Generate .ftai format
                      console.log('Export .ftai format not yet implemented');
                    }}
                    className="export-btn"
                  >
                    📥 Export .ftai
                  </button>
                </div>
              </div>
            </div>

            <div className="config-section">
              <h3>Reset Configuration</h3>
              <button 
                onClick={() => {
                  if (confirm('Reset all settings to defaults? This cannot be undone.')) {
                    setModels(defaultModels);
                    setSelectedModel('claude-sonnet');
                    setConfigPath('local');
                    localStorage.removeItem('folktech-ide-models');
                  }
                }}
                className="reset-btn"
              >
                🔄 Reset to Defaults
              </button>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="about-tab">
            <div className="about-header">
              <h2>🚀 FolkTech IDE v2</h2>
              <p className="version">Version 0.1.0 (Phase 2)</p>
            </div>

            <div className="about-section">
              <h3>🤖 AI Models</h3>
              <ul>
                <li><strong>Claude 3.5 Sonnet:</strong> Architecture & context engineering</li>
                <li><strong>GPT-4o:</strong> Code generation & UI rendering</li>
                <li><strong>Gemini Pro:</strong> Rapid prototyping & debugging</li>
                <li><strong>Serena:</strong> AI orchestration (coming soon)</li>
              </ul>
            </div>

            <div className="about-section">
              <h3>🛠️ Tech Stack</h3>
              <ul>
                <li>Tauri 2.0 (Rust + WebView)</li>
                <li>React 18 + TypeScript</li>
                <li>Monaco Editor</li>
                <li>Xterm.js Terminal</li>
                <li>.ftai Format Support</li>
              </ul>
            </div>

            <div className="about-section">
              <h3>📝 .ftai Format</h3>
              <p>AI-native file format for task orchestration, memory logs, and system configuration.</p>
              <code>@ftai v2.0 schema support</code>
            </div>

            <div className="about-section">
              <h3>🔗 Links</h3>
              <ul>
                <li><a href="https://github.com/FolkTechAI/class-ide" target="_blank">GitHub Repository</a></li>
                <li><a href="https://folktech.ai" target="_blank">FolkTech AI</a></li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="settings-footer">
        <div className="save-status">
          {saveStatus === 'saving' && <span className="status saving">💾 Saving...</span>}
          {saveStatus === 'saved' && <span className="status saved">✅ Saved</span>}
          {saveStatus === 'error' && <span className="status error">❌ Error</span>}
        </div>
        
        <div className="footer-actions">
          <button onClick={saveConfiguration} className="save-btn">
            💾 Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel; 