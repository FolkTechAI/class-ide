import { useState } from "react";
import "./AIAgentPanel.css";

interface AIAgentPanelProps {
  isDarkMode: boolean;
}

interface AIAgent {
  name: string;
  model: string;
  status: 'active' | 'idle' | 'busy';
  role: string;
  icon: string;
}

interface ChatMessage {
  id: string;
  agent: string;
  message: string;
  timestamp: Date;
  type: 'user' | 'agent' | 'system';
}

const AIAgentPanel: React.FC<AIAgentPanelProps> = ({ isDarkMode }) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'chat' | 'memory'>('agents');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      agent: 'Serena',
      message: 'AI orchestration system initialized. Ready to route tasks to appropriate models.',
      timestamp: new Date(),
      type: 'system'
    }
  ]);

  const agents: AIAgent[] = [
    {
      name: 'Serena',
      model: 'Orchestrator',
      status: 'active',
      role: 'Task orchestrator and validator',
      icon: '👑'
    },
    {
      name: 'Claude',
      model: 'Sonnet 3.5',
      status: 'idle',
      role: 'Architecture & context engineering',
      icon: '🧠'
    },
    {
      name: 'GPT-4o',
      model: 'OpenAI',
      status: 'idle',
      role: 'Code generation & UI rendering',
      icon: '⚡'
    },
    {
      name: 'Gemini',
      model: 'Google',
      status: 'idle',
      role: 'Rapid prototyping & debugging',
      icon: '💎'
    }
  ];

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      agent: 'User',
      message: chatInput,
      timestamp: new Date(),
      type: 'user'
    };

    setMessages(prev => [...prev, newMessage]);
    setChatInput('');

    // Simulate AI response
    setTimeout(() => {
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        agent: 'Serena',
        message: 'Message received. Routing to appropriate model based on task complexity and domain.',
        timestamp: new Date(),
        type: 'agent'
      };
      setMessages(prev => [...prev, response]);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'busy': return '#FF9800';
      case 'idle': return '#757575';
      default: return '#757575';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="ai-agent-panel">
      <div className="panel-header">
        <h3>🤖 AI Agents</h3>
        <div className="panel-tabs">
          <button 
            className={`tab ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            Agents
          </button>
          <button 
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button 
            className={`tab ${activeTab === 'memory' ? 'active' : ''}`}
            onClick={() => setActiveTab('memory')}
          >
            Memory
          </button>
        </div>
      </div>

      <div className="panel-content">
        {activeTab === 'agents' && (
          <div className="agents-tab">
            <div className="agents-list">
              {agents.map((agent) => (
                <div key={agent.name} className="agent-card">
                  <div className="agent-header">
                    <span className="agent-icon">{agent.icon}</span>
                    <div className="agent-info">
                      <div className="agent-name">{agent.name}</div>
                      <div className="agent-model">{agent.model}</div>
                    </div>
                    <div 
                      className="agent-status"
                      style={{ backgroundColor: getStatusColor(agent.status) }}
                    />
                  </div>
                  <div className="agent-role">{agent.role}</div>
                  
                  {agent.name === 'Serena' && (
                    <div className="orchestrator-controls">
                      <button className="control-btn">View Tasks</button>
                      <button className="control-btn">Memory Access</button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="model-routing">
              <h4>Model Routing Rules</h4>
              <div className="routing-rules">
                <div className="rule">
                  <span className="rule-trigger">@model_pref: claude_sonnet</span>
                  <span className="rule-arrow">→</span>
                  <span className="rule-target">Claude 3.5+</span>
                </div>
                <div className="rule">
                  <span className="rule-trigger">Code generation</span>
                  <span className="rule-arrow">→</span>
                  <span className="rule-target">GPT-4o</span>
                </div>
                <div className="rule">
                  <span className="rule-trigger">Rapid prototyping</span>
                  <span className="rule-arrow">→</span>
                  <span className="rule-target">Gemini</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="chat-tab">
            <div className="chat-messages">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`message ${message.type}`}
                >
                  <div className="message-header">
                    <span className="message-agent">{message.agent}</span>
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                  </div>
                  <div className="message-content">{message.message}</div>
                </div>
              ))}
            </div>

            <div className="chat-input-container">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Send message to AI agents..."
                className="chat-input"
              />
              <button 
                onClick={handleSendMessage}
                className="send-button"
                disabled={!chatInput.trim()}
              >
                ↗️
              </button>
            </div>
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="memory-tab">
            <div className="memory-section">
              <h4>📊 Memory Access Levels</h4>
              <div className="memory-levels">
                <div className="memory-level">
                  <span className="level-name">Serena</span>
                  <span className="level-access">Full R/W</span>
                </div>
                <div className="memory-level">
                  <span className="level-name">Claude</span>
                  <span className="level-access">ChromaDB + SQLite (Read)</span>
                </div>
                <div className="memory-level">
                  <span className="level-name">GPT-4o</span>
                  <span className="level-access">Task-level only</span>
                </div>
                <div className="memory-level">
                  <span className="level-name">Gemini</span>
                  <span className="level-access">Debug layer only</span>
                </div>
              </div>
            </div>

            <div className="memory-section">
              <h4>🗄️ Storage Systems</h4>
              <div className="storage-systems">
                <div className="storage-item">
                  <span className="storage-icon">🔍</span>
                  <div className="storage-info">
                    <div className="storage-name">ChromaDB</div>
                    <div className="storage-desc">Vector search & task logs</div>
                  </div>
                  <div className="storage-status connected">●</div>
                </div>
                <div className="storage-item">
                  <span className="storage-icon">🗃️</span>
                  <div className="storage-info">
                    <div className="storage-name">SQLite</div>
                    <div className="storage-desc">Structured logs & state</div>
                  </div>
                  <div className="storage-status connected">●</div>
                </div>
                <div className="storage-item">
                  <span className="storage-icon">☁️</span>
                  <div className="storage-info">
                    <div className="storage-name">Firestore</div>
                    <div className="storage-desc">Optional cloud sync</div>
                  </div>
                  <div className="storage-status disconnected">●</div>
                </div>
              </div>
            </div>

            <div className="memory-section">
              <h4>📝 Recent Memory Events</h4>
              <div className="memory-events">
                <div className="memory-event">
                  <span className="event-time">10:30</span>
                  <span className="event-action">Task logged to ChromaDB</span>
                </div>
                <div className="memory-event">
                  <span className="event-time">10:25</span>
                  <span className="event-action">SQLite schema updated</span>
                </div>
                <div className="memory-event">
                  <span className="event-time">10:20</span>
                  <span className="event-action">Serena orchestrator started</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAgentPanel; 