// Note: This is a browser-compatible memory system using IndexedDB
// For desktop Tauri app, this could be replaced with SQLite via Tauri APIs

interface MemoryEntry {
  id: string;
  type: 'task' | 'interaction' | 'file' | 'project' | 'log';
  title: string;
  content: string;
  metadata: Record<string, any>;
  tags: string[];
  timestamp: string;
  projectId?: string;
  parentId?: string;
}

interface ProjectMemory {
  id: string;
  name: string;
  description: string;
  created: string;
  updated: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface SearchQuery {
  query?: string;
  type?: MemoryEntry['type'];
  tags?: string[];
  projectId?: string;
  limit?: number;
  offset?: number;
}

interface SearchResult {
  entries: MemoryEntry[];
  totalCount: number;
  facets: {
    types: Record<string, number>;
    tags: Record<string, number>;
    projects: Record<string, number>;
  };
}

class MemorySystem {
  private dbName = 'folktech-ide-memory';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Memory system initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Memory entries store
        if (!db.objectStoreNames.contains('memories')) {
          const memoriesStore = db.createObjectStore('memories', { keyPath: 'id' });
          memoriesStore.createIndex('type', 'type', { unique: false });
          memoriesStore.createIndex('timestamp', 'timestamp', { unique: false });
          memoriesStore.createIndex('projectId', 'projectId', { unique: false });
          memoriesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }

        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectsStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectsStore.createIndex('name', 'name', { unique: false });
          projectsStore.createIndex('updated', 'updated', { unique: false });
        }

        // Vector embeddings store (for future semantic search)
        if (!db.objectStoreNames.contains('embeddings')) {
          const embeddingsStore = db.createObjectStore('embeddings', { keyPath: 'id' });
          embeddingsStore.createIndex('memoryId', 'memoryId', { unique: true });
        }
      };
    });
  }

  private async ensureConnection(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initializeDatabase();
    }
    if (!this.db) {
      throw new Error('Failed to initialize database connection');
    }
    return this.db;
  }

  /**
   * Store a new memory entry
   */
  async store(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<string> {
    const db = await this.ensureConnection();
    
    const memoryEntry: MemoryEntry = {
      ...entry,
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['memories'], 'readwrite');
      const store = transaction.objectStore('memories');
      const request = store.add(memoryEntry);

      request.onsuccess = () => {
        console.log(`Memory stored: ${memoryEntry.id}`);
        resolve(memoryEntry.id);
      };

      request.onerror = () => {
        console.error('Failed to store memory:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Retrieve a memory entry by ID
   */
  async retrieve(id: string): Promise<MemoryEntry | null> {
    const db = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['memories'], 'readonly');
      const store = transaction.objectStore('memories');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('Failed to retrieve memory:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Search memories with various filters
   */
  async search(query: SearchQuery): Promise<SearchResult> {
    const db = await this.ensureConnection();
    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['memories'], 'readonly');
      const store = transaction.objectStore('memories');
      
      let request: IDBRequest;
      
      // Use appropriate index for efficient querying
      if (query.type) {
        request = store.index('type').openCursor(query.type);
      } else if (query.projectId) {
        request = store.index('projectId').openCursor(query.projectId);
      } else {
        request = store.index('timestamp').openCursor(null, 'prev'); // Most recent first
      }

      const results: MemoryEntry[] = [];
      const facets = {
        types: {} as Record<string, number>,
        tags: {} as Record<string, number>,
        projects: {} as Record<string, number>
      };

      let currentOffset = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor && results.length < limit) {
          const entry: MemoryEntry = cursor.value;
          
          // Apply additional filters
          let matches = true;
          
          if (query.query && !this.matchesTextQuery(entry, query.query)) {
            matches = false;
          }
          
          if (query.tags && !query.tags.some(tag => entry.tags.includes(tag))) {
            matches = false;
          }

          if (matches) {
            // Update facets
            facets.types[entry.type] = (facets.types[entry.type] || 0) + 1;
            entry.tags.forEach(tag => {
              facets.tags[tag] = (facets.tags[tag] || 0) + 1;
            });
            if (entry.projectId) {
              facets.projects[entry.projectId] = (facets.projects[entry.projectId] || 0) + 1;
            }

            // Apply offset/limit
            if (currentOffset >= offset) {
              results.push(entry);
            }
            currentOffset++;
          }

          cursor.continue();
        } else {
          resolve({
            entries: results,
            totalCount: currentOffset,
            facets
          });
        }
      };

      request.onerror = () => {
        console.error('Failed to search memories:', request.error);
        reject(request.error);
      };
    });
  }

  private matchesTextQuery(entry: MemoryEntry, query: string): boolean {
    const searchText = `${entry.title} ${entry.content} ${entry.tags.join(' ')}`.toLowerCase();
    const queryLower = query.toLowerCase();
    return searchText.includes(queryLower);
  }

  /**
   * Store AI interaction for learning and context
   */
  async storeAIInteraction(
    prompt: string, 
    response: string, 
    model: string, 
    task: string,
    projectId?: string
  ): Promise<string> {
    return this.store({
      type: 'interaction',
      title: `AI ${task} with ${model}`,
      content: `Prompt: ${prompt}\n\nResponse: ${response}`,
      metadata: {
        model,
        task,
        tokensUsed: response.length // Approximate
      },
      tags: ['ai-interaction', model, task],
      projectId
    });
  }

  /**
   * Store file context and analysis
   */
  async storeFileContext(
    filePath: string, 
    content: string, 
    analysis?: string,
    projectId?: string
  ): Promise<string> {
    const fileExtension = filePath.split('.').pop() || '';
    
    return this.store({
      type: 'file',
      title: `File: ${filePath}`,
      content: analysis || content,
      metadata: {
        filePath,
        extension: fileExtension,
        size: content.length,
        lastModified: new Date().toISOString()
      },
      tags: ['file-context', fileExtension],
      projectId
    });
  }

  /**
   * Store development logs and events
   */
  async storeLog(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    details?: Record<string, any>,
    projectId?: string
  ): Promise<string> {
    return this.store({
      type: 'log',
      title: `${level.toUpperCase()}: ${message}`,
      content: details ? JSON.stringify(details, null, 2) : message,
      metadata: {
        level,
        source: 'folktech-ide',
        ...details
      },
      tags: ['log', level],
      projectId
    });
  }

  /**
   * Project management
   */
  async createProject(name: string, description: string): Promise<string> {
    const db = await this.ensureConnection();
    
    const project: ProjectMemory = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      tags: [],
      metadata: {}
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.add(project);

      request.onsuccess = () => {
        console.log(`Project created: ${project.id}`);
        resolve(project.id);
      };

      request.onerror = () => {
        console.error('Failed to create project:', request.error);
        reject(request.error);
      };
    });
  }

  async getProjects(): Promise<ProjectMemory[]> {
    const db = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Failed to get projects:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Generate context summary for AI prompts
   */
  async getProjectContext(projectId: string, maxEntries: number = 10): Promise<string> {
    const searchResult = await this.search({
      projectId,
      limit: maxEntries
    });

    const lines: string[] = [];
    lines.push(`[PROJECT CONTEXT - ${maxEntries} recent entries]`);
    lines.push('');

    for (const entry of searchResult.entries) {
      lines.push(`${entry.type.toUpperCase()}: ${entry.title}`);
      lines.push(entry.content.substring(0, 200) + (entry.content.length > 200 ? '...' : ''));
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Clear old entries to manage storage
   */
  async cleanupOldEntries(daysToKeep: number = 30): Promise<number> {
    const db = await this.ensureConnection();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['memories'], 'readwrite');
      const store = transaction.objectStore('memories');
      const index = store.index('timestamp');
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffDate.toISOString()));

      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          console.log(`Cleaned up ${deletedCount} old memory entries`);
          resolve(deletedCount);
        }
      };

      request.onerror = () => {
        console.error('Failed to cleanup memories:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Export memories for backup
   */
  async exportMemories(): Promise<string> {
    const searchResult = await this.search({ limit: 1000 });
    const projects = await this.getProjects();

    const exportData = {
      version: '1.0',
      exported: new Date().toISOString(),
      projects,
      memories: searchResult.entries
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Get memory statistics
   */
  async getStats(): Promise<{
    totalMemories: number;
    typeCounts: Record<string, number>;
    projectCounts: Record<string, number>;
    storageUsed: string;
  }> {
    const searchResult = await this.search({ limit: 10000 });
    
    return {
      totalMemories: searchResult.totalCount,
      typeCounts: searchResult.facets.types,
      projectCounts: searchResult.facets.projects,
      storageUsed: 'Unknown' // IndexedDB doesn't provide easy storage size calculation
    };
  }
}

// Singleton instance
export const memorySystem = new MemorySystem();
export default MemorySystem;
export type { MemoryEntry, ProjectMemory, SearchQuery, SearchResult }; 