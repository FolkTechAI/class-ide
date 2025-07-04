interface FtaiDocument {
  version: string;
  document?: {
    title?: string;
    author?: string;
    schema?: string;
    tags?: string[];
    created?: string;
    modified?: string;
  };
  content: string;
  blocks: FtaiBlock[];
}

interface FtaiBlock {
  type: string;
  id?: string;
  attributes: Record<string, any>;
  content: string;
  lineStart: number;
  lineEnd: number;
}

interface FtaiTask extends FtaiBlock {
  type: 'task';
  attributes: {
    goal?: string;
    model_pref?: string;
    context?: string;
    stack?: string;
    constraints?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    status?: 'open' | 'in_progress' | 'completed' | 'blocked';
    assigned_to?: string;
  };
}

interface FtaiIssue extends FtaiBlock {
  type: 'issue';
  attributes: {
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    file?: string;
    description: string;
    recommendation?: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
  };
}

interface FtaiAiNote extends FtaiBlock {
  type: 'ai_note';
  attributes: {
    model?: string;
    confidence?: number;
    timestamp?: string;
    context?: string;
  };
}

class FtaiParser {
  private static readonly VERSION_REGEX = /^@ftai\s+v?(\d+\.\d+)$/;
  private static readonly BLOCK_START_REGEX = /^@(\w+)(?:\s+(.*))?$/;
  private static readonly ATTRIBUTE_REGEX = /^(\w+):\s*(.+)$/;
  private static readonly END_BLOCK_REGEX = /^@end$/;

  /**
   * Parse .ftai content into structured document
   */
  static parse(content: string): FtaiDocument {
    const lines = content.split('\n');
    const document: FtaiDocument = {
      version: '2.0',
      content,
      blocks: []
    };

    let currentBlock: Partial<FtaiBlock> | null = null;
    let currentBlockContent: string[] = [];
    let inBlockContent = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Check for version declaration
      if (line.match(this.VERSION_REGEX)) {
        const match = line.match(this.VERSION_REGEX);
        if (match) {
          document.version = match[1];
        }
        continue;
      }

      // Check for block start
      const blockMatch = line.match(this.BLOCK_START_REGEX);
      if (blockMatch) {
        // Save previous block if exists
        if (currentBlock) {
          this.finalizeBlock(currentBlock, currentBlockContent, document);
          currentBlockContent = [];
        }

        const blockType = blockMatch[1];
        const blockParams = blockMatch[2];

        currentBlock = {
          type: blockType,
          attributes: {},
          lineStart: lineNumber
        };

        // Handle special case for document block
        if (blockType === 'document') {
          inBlockContent = false; // Document block is metadata only
        } else {
          inBlockContent = false; // Will be set to true after attributes
        }

                 // Parse inline parameters
         if (blockParams && currentBlock.attributes) {
           this.parseInlineParams(blockParams, currentBlock.attributes);
         }

        continue;
      }

      // Check for block end
      if (line.match(this.END_BLOCK_REGEX)) {
        if (currentBlock) {
          currentBlock.lineEnd = lineNumber;
          this.finalizeBlock(currentBlock, currentBlockContent, document);
          currentBlock = null;
          currentBlockContent = [];
          inBlockContent = false;
        }
        continue;
      }

      // Parse attributes or content
      if (currentBlock) {
        const attrMatch = line.match(this.ATTRIBUTE_REGEX);
        
                 if (attrMatch && !inBlockContent && currentBlock.attributes) {
           const [, key, value] = attrMatch;
           currentBlock.attributes[key] = this.parseAttributeValue(value);
         } else if (line === '---' && !inBlockContent) {
          // Content separator
          inBlockContent = true;
        } else if (inBlockContent || (!attrMatch && line !== '')) {
          // Content line
          inBlockContent = true;
          currentBlockContent.push(lines[i]); // Keep original line with spacing
        }
      } else if (line !== '') {
        // Content outside of blocks (main document content)
        // This is prose content that should be preserved
      }
    }

    // Finalize last block
    if (currentBlock) {
      currentBlock.lineEnd = lines.length;
      this.finalizeBlock(currentBlock, currentBlockContent, document);
    }

    return document;
  }

  private static parseInlineParams(params: string, attributes: Record<string, any>): void {
    // Parse key=value pairs or simple values
    const pairs = params.split(/\s+/);
    for (const pair of pairs) {
      if (pair.includes('=')) {
        const [key, value] = pair.split('=', 2);
        attributes[key] = this.parseAttributeValue(value);
      } else {
        attributes.id = pair;
      }
    }
  }

  private static parseAttributeValue(value: string): any {
    value = value.trim();
    
    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Parse arrays
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        return JSON.parse(value);
      } catch {
        // Fallback to comma-separated
        return value.slice(1, -1).split(',').map(s => s.trim());
      }
    }

    // Parse numbers
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    if (/^\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    }

    // Parse booleans
    if (value === 'true') return true;
    if (value === 'false') return false;

    return value;
  }

  private static finalizeBlock(
    block: Partial<FtaiBlock>, 
    content: string[], 
    document: FtaiDocument
  ): void {
    const finalBlock: FtaiBlock = {
      type: block.type!,
      attributes: block.attributes || {},
      content: content.join('\n'),
      lineStart: block.lineStart || 0,
      lineEnd: block.lineEnd || 0
    };

    if (block.type === 'document') {
      document.document = finalBlock.attributes;
    } else {
      document.blocks.push(finalBlock);
    }
  }

  /**
   * Generate .ftai content from structured document
   */
  static generate(document: FtaiDocument): string {
    const lines: string[] = [];

    // Version header
    lines.push(`@ftai v${document.version}`);
    lines.push('');

    // Document metadata
    if (document.document) {
      lines.push('@document');
      for (const [key, value] of Object.entries(document.document)) {
        lines.push(`${key}: ${this.formatAttributeValue(value)}`);
      }
      lines.push('');
    }

    // Add separator for main content
    if (document.blocks.length > 0) {
      lines.push('---');
      lines.push('');
    }

    // Add main prose content (extract from original if available)
    if (document.content) {
      const proseContent = this.extractProseContent(document.content);
      if (proseContent.trim()) {
        lines.push(proseContent);
        lines.push('');
        lines.push('---');
        lines.push('');
      }
    }

    // Blocks
    for (const block of document.blocks) {
      // Block header
      lines.push(`@${block.type}`);

      // Block attributes
      for (const [key, value] of Object.entries(block.attributes)) {
        lines.push(`${key}: ${this.formatAttributeValue(value)}`);
      }

      // Content separator and content
      if (block.content.trim()) {
        lines.push('');
        lines.push('---');
        lines.push('');
        lines.push(block.content);
      }

      lines.push('');
      lines.push('@end');
      lines.push('');
    }

    return lines.join('\n');
  }

  private static formatAttributeValue(value: any): string {
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    if (typeof value === 'string' && (value.includes(' ') || value.includes(':'))) {
      return `"${value}"`;
    }
    return String(value);
  }

  private static extractProseContent(originalContent: string): string {
    // Extract content that's not in blocks
    const lines = originalContent.split('\n');
    const proseLines: string[] = [];
    let inBlock = false;

    for (const line of lines) {
      if (line.match(this.BLOCK_START_REGEX)) {
        inBlock = true;
        continue;
      }
      if (line.match(this.END_BLOCK_REGEX)) {
        inBlock = false;
        continue;
      }
      if (!inBlock && !line.match(this.VERSION_REGEX) && line !== '---') {
        proseLines.push(line);
      }
    }

    return proseLines.join('\n').trim();
  }

  /**
   * Validate .ftai document structure
   */
  static validate(document: FtaiDocument): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check version
    if (!document.version || !document.version.match(/^\d+\.\d+$/)) {
      errors.push('Invalid or missing version number');
    }

    // Validate blocks
    for (const block of document.blocks) {
      switch (block.type) {
        case 'task':
          this.validateTaskBlock(block as FtaiTask, errors);
          break;
        case 'issue':
          this.validateIssueBlock(block as FtaiIssue, errors);
          break;
        case 'ai_note':
          this.validateAiNoteBlock(block as FtaiAiNote, errors);
          break;
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private static validateTaskBlock(task: FtaiTask, errors: string[]): void {
    if (!task.attributes.goal) {
      errors.push('Task block missing required "goal" attribute');
    }
    if (task.attributes.priority && !['low', 'medium', 'high', 'critical'].includes(task.attributes.priority)) {
      errors.push('Task block has invalid priority value');
    }
    if (task.attributes.status && !['open', 'in_progress', 'completed', 'blocked'].includes(task.attributes.status)) {
      errors.push('Task block has invalid status value');
    }
  }

  private static validateIssueBlock(issue: FtaiIssue, errors: string[]): void {
    if (!issue.attributes.id) {
      errors.push('Issue block missing required "id" attribute');
    }
    if (!issue.attributes.severity || !['low', 'medium', 'high', 'critical'].includes(issue.attributes.severity)) {
      errors.push('Issue block missing or invalid "severity" attribute');
    }
    if (!issue.attributes.description) {
      errors.push('Issue block missing required "description" attribute');
    }
  }

  private static validateAiNoteBlock(note: FtaiAiNote, errors: string[]): void {
    if (note.attributes.confidence !== undefined && 
        (typeof note.attributes.confidence !== 'number' || 
         note.attributes.confidence < 0 || 
         note.attributes.confidence > 1)) {
      errors.push('AI note block has invalid confidence value (must be 0-1)');
    }
  }

  /**
   * Create new .ftai document templates
   */
  static createTaskTemplate(goal: string, modelPref?: string): FtaiDocument {
    return {
      version: '2.0',
      document: {
        title: 'AI Task',
        author: 'FolkTech IDE',
        schema: 'task',
        created: new Date().toISOString(),
        tags: ['ai-task']
      },
      content: '',
      blocks: [{
        type: 'task',
        attributes: {
          goal,
          model_pref: modelPref || 'claude-sonnet',
          priority: 'medium',
          status: 'open',
          context: 'Generated by FolkTech IDE'
        },
        content: `This task will: ${goal}`,
        lineStart: 1,
        lineEnd: 10
      }]
    };
  }

  static createIssueTemplate(description: string, severity: string): FtaiDocument {
    return {
      version: '2.0',
      document: {
        title: 'Issue Report',
        author: 'FolkTech IDE',
        schema: 'audit_qa',
        created: new Date().toISOString(),
        tags: ['issue', 'audit']
      },
      content: '',
      blocks: [{
        type: 'issue',
        attributes: {
          id: Date.now().toString(),
          severity: severity as any,
          category: 'Code Quality',
          description,
          status: 'open'
        },
        content: description,
        lineStart: 1,
        lineEnd: 10
      }]
    };
  }
}

export default FtaiParser;
export type { FtaiDocument, FtaiBlock, FtaiTask, FtaiIssue, FtaiAiNote }; 