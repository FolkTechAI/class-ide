import { aiRouter, AIRequest, AIResponse } from './AIRouter';
import FtaiParser, { FtaiTask } from './FtaiParser';

interface MCPAgent {
  id: string;
  name: string;
  role: 'orchestrator' | 'generator' | 'validator' | 'debugger';
  modelId: string;
  isActive: boolean;
  capabilities: string[];
}

interface MCPTask {
  id: string;
  type: 'generation' | 'validation' | 'debugging' | 'analysis';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'running' | 'completed' | 'failed';
  assignedAgent?: string;
  prompt: string;
  context?: string;
  result?: AIResponse;
  createdAt: string;
  completedAt?: string;
}

interface MCPWorkflow {
  id: string;
  name: string;
  steps: MCPTask[];
  currentStep: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

class MCPFramework {
  private agents: MCPAgent[] = [];
  private tasks: MCPTask[] = [];
  private workflows: MCPWorkflow[] = [];

  constructor() {
    this.initializeDefaultAgents();
  }

  private initializeDefaultAgents(): void {
    this.agents = [
      {
        id: 'serena-orchestrator',
        name: 'Serena Orchestrator',
        role: 'orchestrator',
        modelId: 'serena',
        isActive: true,
        capabilities: ['task-routing', 'workflow-management', 'agent-coordination']
      },
      {
        id: 'claude-architect',
        name: 'Claude Architect',
        role: 'generator',
        modelId: 'claude-sonnet',
        isActive: true,
        capabilities: ['architecture-design', 'context-engineering', 'code-review']
      },
      {
        id: 'gpt4o-codegen',
        name: 'GPT-4o CodeGen',
        role: 'generator',
        modelId: 'gpt-4o',
        isActive: true,
        capabilities: ['code-generation', 'ui-rendering', 'rapid-prototyping']
      },
      {
        id: 'gemini-debugger',
        name: 'Gemini Debugger',
        role: 'debugger',
        modelId: 'gemini-pro',
        isActive: true,
        capabilities: ['debugging', 'error-analysis', 'performance-optimization']
      }
    ];
  }

  /**
   * Process .ftai task file and create MCP workflow
   */
  async processFtaiTask(ftaiContent: string): Promise<string> {
    try {
      const document = FtaiParser.parse(ftaiContent);
      const validation = FtaiParser.validate(document);

      if (!validation.valid) {
        return `Error: Invalid .ftai document:\n${validation.errors.join('\n')}`;
      }

      // Find task blocks
      const taskBlocks = document.blocks.filter(block => block.type === 'task') as FtaiTask[];

      if (taskBlocks.length === 0) {
        return 'No task blocks found in .ftai document';
      }

      const results: string[] = [];

      for (const taskBlock of taskBlocks) {
        const result = await this.executeTask(taskBlock);
        results.push(result);
      }

      return results.join('\n\n---\n\n');
    } catch (error) {
      return `Error processing .ftai task: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async executeTask(task: FtaiTask): Promise<string> {
    const goal = task.attributes.goal;
    const modelPref = task.attributes.model_pref || 'claude-sonnet';
    const context = task.attributes.context || task.content;

    if (!goal) {
      return 'Error: Task missing required "goal" attribute';
    }

    // Determine task type based on goal
    const taskType = this.determineTaskType(goal);

    // Create MCP task
    const mcpTask: MCPTask = {
      id: `task-${Date.now()}`,
      type: taskType,
      priority: (task.attributes.priority as any) || 'medium',
      status: 'pending',
      prompt: goal,
      context,
      createdAt: new Date().toISOString()
    };

    // Assign to appropriate agent
    const agent = this.findAgentForTask(mcpTask, modelPref);
    if (agent) {
      mcpTask.assignedAgent = agent.id;
    }

    this.tasks.push(mcpTask);

    // Execute the task
    const result = await this.executeTaskWithAgent(mcpTask, agent);

    return this.formatTaskResult(mcpTask, result);
  }

  private determineTaskType(goal: string): MCPTask['type'] {
    const lowerGoal = goal.toLowerCase();
    
    if (lowerGoal.includes('debug') || lowerGoal.includes('fix') || lowerGoal.includes('error')) {
      return 'debugging';
    }
    if (lowerGoal.includes('generate') || lowerGoal.includes('create') || lowerGoal.includes('build')) {
      return 'generation';
    }
    if (lowerGoal.includes('validate') || lowerGoal.includes('check') || lowerGoal.includes('review')) {
      return 'validation';
    }
    
    return 'analysis';
  }

  private findAgentForTask(task: MCPTask, preferredModel?: string): MCPAgent | null {
    // First try to find agent with preferred model
    if (preferredModel) {
      const preferredAgent = this.agents.find(agent => 
        agent.isActive && agent.modelId === preferredModel
      );
      if (preferredAgent) return preferredAgent;
    }

    // Find agent by role/capability
    switch (task.type) {
      case 'generation':
        return this.agents.find(agent => 
          agent.isActive && 
          (agent.role === 'generator' || agent.capabilities.includes('code-generation'))
        ) || null;
      
      case 'debugging':
        return this.agents.find(agent => 
          agent.isActive && 
          (agent.role === 'debugger' || agent.capabilities.includes('debugging'))
        ) || null;
      
      case 'validation':
        return this.agents.find(agent => 
          agent.isActive && 
          agent.capabilities.includes('code-review')
        ) || null;
      
      default:
        return this.agents.find(agent => 
          agent.isActive && agent.role === 'orchestrator'
        ) || null;
    }
  }

  private async executeTaskWithAgent(task: MCPTask, agent: MCPAgent | null): Promise<AIResponse> {
    task.status = 'running';

    if (!agent) {
      const errorResponse: AIResponse = {
        content: 'No suitable agent found for task',
        model: 'none',
        tokensUsed: 0,
        timestamp: new Date().toISOString(),
        success: false,
        error: 'Agent assignment failed'
      };
      task.status = 'failed';
      task.result = errorResponse;
      return errorResponse;
    }

    try {
      const aiRequest: AIRequest = {
        prompt: task.prompt,
        task: this.mapTaskTypeToAITask(task.type),
        context: task.context
      };

      const response = await aiRouter.generateResponse(aiRequest);
      
      if (response.success) {
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
      } else {
        task.status = 'failed';
      }

      task.result = response;
      return response;
    } catch (error) {
      const errorResponse: AIResponse = {
        content: '',
        model: agent.modelId,
        tokensUsed: 0,
        timestamp: new Date().toISOString(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      task.status = 'failed';
      task.result = errorResponse;
      return errorResponse;
    }
  }

  private mapTaskTypeToAITask(taskType: MCPTask['type']): AIRequest['task'] {
    switch (taskType) {
      case 'generation': return 'codeGeneration';
      case 'debugging': return 'debugging';
      case 'validation': return 'contextEngineering';
      case 'analysis': return 'contextEngineering';
      default: return 'contextEngineering';
    }
  }

  private formatTaskResult(task: MCPTask, result: AIResponse): string {
    const lines: string[] = [];
    
    lines.push(`[MCP TASK RESULT]`);
    lines.push(`Task ID: ${task.id}`);
    lines.push(`Type: ${task.type}`);
    lines.push(`Status: ${task.status}`);
    lines.push(`Agent: ${task.assignedAgent || 'None'}`);
    lines.push(`Model: ${result.model}`);
    lines.push(`Tokens Used: ${result.tokensUsed}`);
    lines.push('');

    if (result.success) {
      lines.push('Result:');
      lines.push(result.content);
    } else {
      lines.push('Error:');
      lines.push(result.error || 'Unknown error occurred');
    }

    return lines.join('\n');
  }

  /**
   * Terminal command interface
   */
  async handleTerminalCommand(command: string, args: string[]): Promise<string> {
    switch (command) {
      case 'ai':
        return this.handleAICommand(args);
      case 'mcp':
        return this.handleMCPCommand(args);
      case 'ftai':
        return this.handleFtaiCommand(args);
      default:
        return `Unknown MCP command: ${command}`;
    }
  }

  private async handleAICommand(args: string[]): Promise<string> {
    if (args.length === 0) {
      return this.getAICommandHelp();
    }

    const subcommand = args[0];
    const remainingArgs = args.slice(1);

    switch (subcommand) {
      case 'generate':
        return this.handleGenerateCommand(remainingArgs);
      case 'validate':
        return this.handleValidateCommand(remainingArgs);
      case 'debug':
        return this.handleDebugCommand(remainingArgs);
      case 'status':
        return this.getAIStatus();
      default:
        return `Unknown AI subcommand: ${subcommand}\n\n${this.getAICommandHelp()}`;
    }
  }

  private async handleGenerateCommand(args: string[]): Promise<string> {
    if (args.length === 0) {
      return 'Usage: ai generate <prompt> [--model=<model>] [--context=<context>]';
    }

    const prompt = args.join(' ');
    
    const aiRequest: AIRequest = {
      prompt,
      task: 'codeGeneration',
      context: 'Terminal generation request'
    };

    const response = await aiRouter.generateResponse(aiRequest);

    if (response.success) {
      return `[${response.model.toUpperCase()}] Generated:\n\n${response.content}`;
    } else {
      return `Generation failed: ${response.error}`;
    }
  }

  private async handleValidateCommand(args: string[]): Promise<string> {
    if (args.length === 0) {
      return 'Usage: ai validate <code or file> [--type=<language>]';
    }

    const content = args.join(' ');
    
    const aiRequest: AIRequest = {
      prompt: `Validate this code and provide feedback:\n\n${content}`,
      task: 'debugging',
      context: 'Code validation request'
    };

    const response = await aiRouter.generateResponse(aiRequest);

    if (response.success) {
      return `[VALIDATION] ${response.model}:\n\n${response.content}`;
    } else {
      return `Validation failed: ${response.error}`;
    }
  }

  private async handleDebugCommand(args: string[]): Promise<string> {
    if (args.length === 0) {
      return 'Usage: ai debug <error or code> [--context=<context>]';
    }

    const problem = args.join(' ');
    
    const aiRequest: AIRequest = {
      prompt: `Debug this issue:\n\n${problem}`,
      task: 'debugging',
      context: 'Debugging assistance request'
    };

    const response = await aiRouter.generateResponse(aiRequest);

    if (response.success) {
      return `[DEBUG] ${response.model}:\n\n${response.content}`;
    } else {
      return `Debug failed: ${response.error}`;
    }
  }

  private getAIStatus(): string {
    const availableModels = aiRouter.getAvailableModels();
    const history = aiRouter.getRequestHistory();
    
    const lines: string[] = [];
    lines.push('[AI SYSTEM STATUS]');
    lines.push('');
    lines.push('Available Models:');
    
    for (const model of availableModels) {
      lines.push(`  • ${model.name} (${model.provider}) - ${model.status}`);
    }
    
    lines.push('');
    lines.push(`Recent Requests: ${history.length}`);
    lines.push(`Success Rate: ${Math.round((history.filter(r => r.success).length / Math.max(history.length, 1)) * 100)}%`);
    
    return lines.join('\n');
  }

  private getAICommandHelp(): string {
    return `AI Commands:
  ai generate <prompt>     - Generate code or content
  ai validate <code>       - Validate and review code
  ai debug <error>         - Debug issues and errors
  ai status               - Show AI system status

Examples:
  ai generate "Create a React component for user login"
  ai validate "function foo() { return bar; }"
  ai debug "TypeError: Cannot read property 'map' of undefined"`;
  }

  private async handleMCPCommand(args: string[]): Promise<string> {
    if (args.length === 0) {
      return this.getMCPCommandHelp();
    }

    const subcommand = args[0];

    switch (subcommand) {
      case 'status':
        return this.getMCPStatus();
      case 'agents':
        return this.getAgentsStatus();
      case 'tasks':
        return this.getTasksStatus();
      case 'clear':
        this.clearTaskHistory();
        return 'Task history cleared';
      default:
        return `Unknown MCP subcommand: ${subcommand}\n\n${this.getMCPCommandHelp()}`;
    }
  }

  private async handleFtaiCommand(args: string[]): Promise<string> {
    if (args.length === 0) {
      return this.getFtaiCommandHelp();
    }

    const subcommand = args[0];
    const remainingArgs = args.slice(1);

    switch (subcommand) {
      case 'parse':
        if (remainingArgs.length === 0) {
          return 'Usage: ftai parse <content>';
        }
        return this.parseFtaiContent(remainingArgs.join(' '));
      case 'validate':
        if (remainingArgs.length === 0) {
          return 'Usage: ftai validate <content>';
        }
        return this.validateFtaiContent(remainingArgs.join(' '));
      case 'create':
        return this.createFtaiTemplate(remainingArgs[0] || 'task', remainingArgs.slice(1).join(' '));
      default:
        return `Unknown .ftai subcommand: ${subcommand}\n\n${this.getFtaiCommandHelp()}`;
    }
  }

  private parseFtaiContent(content: string): string {
    try {
      const document = FtaiParser.parse(content);
      return `[.FTAI PARSE RESULT]\n\nVersion: ${document.version}\nBlocks: ${document.blocks.length}\n\n${JSON.stringify(document, null, 2)}`;
    } catch (error) {
      return `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private validateFtaiContent(content: string): string {
    try {
      const document = FtaiParser.parse(content);
      const validation = FtaiParser.validate(document);
      
      if (validation.valid) {
        return '[.FTAI VALIDATION] ✅ Document is valid';
      } else {
        return `[.FTAI VALIDATION] ❌ Errors found:\n${validation.errors.join('\n')}`;
      }
    } catch (error) {
      return `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private createFtaiTemplate(type: string, goal: string): string {
    try {
      let document;
      
      if (type === 'task') {
        document = FtaiParser.createTaskTemplate(goal || 'Example task');
      } else if (type === 'issue') {
        document = FtaiParser.createIssueTemplate(goal || 'Example issue', 'medium');
      } else {
        return 'Usage: ftai create <task|issue> <description>';
      }

      const generated = FtaiParser.generate(document);
      return `[.FTAI TEMPLATE CREATED]\n\n${generated}`;
    } catch (error) {
      return `Template creation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private getMCPStatus(): string {
    const activeAgents = this.agents.filter(a => a.isActive);
    const activeTasks = this.getActiveTasks();
    const completedTasks = this.getCompletedTasks();

    return `[MCP FRAMEWORK STATUS]

Active Agents: ${activeAgents.length}/${this.agents.length}
${activeAgents.map(a => `  • ${a.name} (${a.role})`).join('\n')}

Tasks:
  • Active: ${activeTasks.length}
  • Completed: ${completedTasks.length}
  • Total: ${this.tasks.length}

Workflows: ${this.workflows.length}`;
  }

  private getAgentsStatus(): string {
    const lines: string[] = [];
    lines.push('[MCP AGENTS]');
    lines.push('');

    for (const agent of this.agents) {
      lines.push(`${agent.isActive ? '🟢' : '🔴'} ${agent.name}`);
      lines.push(`   Role: ${agent.role}`);
      lines.push(`   Model: ${agent.modelId}`);
      lines.push(`   Capabilities: ${agent.capabilities.join(', ')}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  private getTasksStatus(): string {
    const lines: string[] = [];
    lines.push('[MCP TASKS]');
    lines.push('');

    const recentTasks = this.tasks.slice(-10);
    
    for (const task of recentTasks) {
      const status = task.status === 'completed' ? '✅' : 
                   task.status === 'failed' ? '❌' : 
                   task.status === 'running' ? '🔄' : '⏳';
      
      lines.push(`${status} ${task.id} (${task.type})`);
      lines.push(`   ${task.prompt.substring(0, 60)}...`);
      lines.push(`   Agent: ${task.assignedAgent || 'None'}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  private getMCPCommandHelp(): string {
    return `MCP Commands:
  mcp status     - Show MCP framework status
  mcp agents     - List all agents and their status
  mcp tasks      - Show recent task history
  mcp clear      - Clear completed task history`;
  }

  private getFtaiCommandHelp(): string {
    return `.FTAI Commands:
  ftai parse <content>        - Parse .ftai content
  ftai validate <content>     - Validate .ftai document
  ftai create task <goal>     - Create task template
  ftai create issue <desc>    - Create issue template

Examples:
  ftai create task "Build user authentication system"
  ftai validate "@ftai v2.0..."`;
  }

  // Utility methods
  getActiveTasks(): MCPTask[] {
    return this.tasks.filter(task => task.status === 'running' || task.status === 'pending');
  }

  getCompletedTasks(): MCPTask[] {
    return this.tasks.filter(task => task.status === 'completed');
  }

  getAgents(): MCPAgent[] {
    return this.agents;
  }

  clearTaskHistory(): void {
    this.tasks = this.tasks.filter(task => task.status === 'running' || task.status === 'pending');
  }
}

// Singleton instance
export const mcpFramework = new MCPFramework();
export default MCPFramework;
export type { MCPAgent, MCPTask, MCPWorkflow }; 