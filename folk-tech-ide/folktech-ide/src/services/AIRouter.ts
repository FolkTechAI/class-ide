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

interface AIRequest {
  prompt: string;
  task: 'codeGeneration' | 'debugging' | 'contextEngineering' | 'rapidPrototyping' | 'orchestration';
  context?: string;
  fileType?: string;
  maxTokens?: number;
  temperature?: number;
}

interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

class AIRouter {
  private models: ModelConfig[] = [];
  private activeModel: string = '';
  private requestHistory: AIResponse[] = [];

  constructor() {
    this.loadConfiguration();
  }

  private loadConfiguration(): void {
    try {
      const savedConfig = localStorage.getItem('folktech-ide-models');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        this.models = parsed.models || [];
        this.activeModel = parsed.activeModel || '';
      }
    } catch (error) {
      console.error('Failed to load AI configuration:', error);
    }
  }

  private getModelForTask(task: keyof ModelConfig['permissions']): ModelConfig | null {
    // First try the active model if it has permission
    const active = this.models.find(m => m.id === this.activeModel);
    if (active?.isActive && active.permissions[task] && active.apiKey) {
      return active;
    }

    // Fallback to any model with permission for this task
    return this.models.find(m => 
      m.isActive && 
      m.permissions[task] && 
      m.apiKey && 
      m.status !== 'error'
    ) || null;
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const model = this.getModelForTask(request.task);
    
    if (!model) {
      return {
        content: '',
        model: 'none',
        tokensUsed: 0,
        timestamp: new Date().toISOString(),
        success: false,
        error: `No available model found for task: ${request.task}`
      };
    }

    try {
      let response: AIResponse;

      switch (model.provider) {
        case 'Anthropic':
          response = await this.callClaude(request, model);
          break;
        case 'OpenAI':
          response = await this.callOpenAI(request, model);
          break;
        case 'Google':
          response = await this.callGemini(request, model);
          break;
        case 'FolkTech':
          response = await this.callSerena(request, model);
          break;
        default:
          throw new Error(`Unknown provider: ${model.provider}`);
      }

      // Store in history
      this.requestHistory.push(response);
      
      // Keep only last 100 requests
      if (this.requestHistory.length > 100) {
        this.requestHistory = this.requestHistory.slice(-100);
      }

      return response;
    } catch (error) {
      const errorResponse: AIResponse = {
        content: '',
        model: model.id,
        tokensUsed: 0,
        timestamp: new Date().toISOString(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.requestHistory.push(errorResponse);
      return errorResponse;
    }
  }

  private async callClaude(request: AIRequest, model: ModelConfig): Promise<AIResponse> {
    if (!model.apiKey) {
      throw new Error('Claude API key not configured');
    }

    // For now, return a mock response until Anthropic resolves their outage
    // TODO: Implement actual Claude API call
    const mockResponse: AIResponse = {
      content: `[MOCK CLAUDE RESPONSE]\n\nI would help you with: ${request.prompt}\n\nTask: ${request.task}\nContext: ${request.context || 'None'}\n\nThis is a placeholder response. Actual Claude integration will be enabled once API access is restored.`,
      model: model.id,
      tokensUsed: Math.floor(Math.random() * 1000) + 100,
      timestamp: new Date().toISOString(),
      success: true
    };

    return mockResponse;

    /* 
    // Actual implementation when Claude API is available:
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': model.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: request.maxTokens || model.maxTokens || 4000,
        temperature: request.temperature || model.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: `Task: ${request.task}\n\nPrompt: ${request.prompt}\n\nContext: ${request.context || 'None'}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.content[0].text,
      model: model.id,
      tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
      timestamp: new Date().toISOString(),
      success: true
    };
    */
  }

  private async callOpenAI(request: AIRequest, model: ModelConfig): Promise<AIResponse> {
    if (!model.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Mock response for now
    const mockResponse: AIResponse = {
      content: `[MOCK GPT-4O RESPONSE]\n\nTask: ${request.task}\nPrompt: ${request.prompt}\n\nThis is a simulated GPT-4o response. Real integration requires API key configuration.`,
      model: model.id,
      tokensUsed: Math.floor(Math.random() * 800) + 50,
      timestamp: new Date().toISOString(),
      success: true
    };

    return mockResponse;

    /*
    // Actual implementation:
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant specialized in ${request.task}. Provide helpful, accurate responses.`
          },
          {
            role: 'user',
            content: `${request.prompt}\n\nContext: ${request.context || 'None'}`
          }
        ],
        max_tokens: request.maxTokens || model.maxTokens || 4000,
        temperature: request.temperature || model.temperature || 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      model: model.id,
      tokensUsed: data.usage.total_tokens,
      timestamp: new Date().toISOString(),
      success: true
    };
    */
  }

  private async callGemini(request: AIRequest, model: ModelConfig): Promise<AIResponse> {
    if (!model.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Mock response for now
    const mockResponse: AIResponse = {
      content: `[MOCK GEMINI RESPONSE]\n\nAnalyzing request for ${request.task}:\n${request.prompt}\n\nGemini would provide rapid prototyping and debugging assistance here.`,
      model: model.id,
      tokensUsed: Math.floor(Math.random() * 600) + 75,
      timestamp: new Date().toISOString(),
      success: true
    };

    return mockResponse;

    /*
    // Actual implementation:
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${model.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Task: ${request.task}\n\nPrompt: ${request.prompt}\n\nContext: ${request.context || 'None'}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: request.temperature || model.temperature || 0.5,
          maxOutputTokens: request.maxTokens || model.maxTokens || 2048
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.candidates[0].content.parts[0].text,
      model: model.id,
      tokensUsed: data.usageMetadata?.totalTokenCount || 0,
      timestamp: new Date().toISOString(),
      success: true
    };
    */
  }

  private async callSerena(request: AIRequest, model: ModelConfig): Promise<AIResponse> {
    // Serena orchestrator - local model for task routing
    const response: AIResponse = {
      content: `[SERENA ORCHESTRATOR]\n\nTask Analysis: ${request.task}\nPrompt: ${request.prompt}\n\nSerena would coordinate between models and provide intelligent task routing. This is a placeholder for the local orchestrator system.`,
      model: model.id,
      tokensUsed: 0, // Local model, no token usage
      timestamp: new Date().toISOString(),
      success: true
    };

    return response;
  }

  // Utility methods
  getAvailableModels(): ModelConfig[] {
    return this.models.filter(m => m.isActive && m.apiKey);
  }

  getRequestHistory(): AIResponse[] {
    return this.requestHistory;
  }

  clearHistory(): void {
    this.requestHistory = [];
  }

  async testModelConnection(modelId: string): Promise<boolean> {
    const model = this.models.find(m => m.id === modelId);
    if (!model || !model.apiKey) return false;

    try {
      const testRequest: AIRequest = {
        prompt: 'Hello, this is a connection test.',
        task: 'contextEngineering'
      };

      const response = await this.generateResponse(testRequest);
      return response.success;
    } catch (error) {
      console.error('Model connection test failed:', error);
      return false;
    }
  }

  // Model capability queries
  canPerformTask(task: keyof ModelConfig['permissions']): boolean {
    return this.getModelForTask(task) !== null;
  }

  getModelForTaskName(task: keyof ModelConfig['permissions']): string {
    const model = this.getModelForTask(task);
    return model ? model.name : 'None available';
  }
}

// Singleton instance
export const aiRouter = new AIRouter();
export default AIRouter;
export type { AIRequest, AIResponse, ModelConfig }; 