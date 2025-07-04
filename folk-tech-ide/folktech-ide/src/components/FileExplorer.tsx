import { useState, useEffect } from "react";

import "./FileExplorer.css";

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

interface FileExplorerProps {
  onFileSelect: (filePath: string, content: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect }) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProjectFiles();
  }, []);

  const loadProjectFiles = async () => {
    try {
      // For now, create some mock files including .ftai files
      const mockFiles: FileNode[] = [
        {
          name: "src",
          path: "src",
          isDirectory: true,
          children: [
            { name: "App.tsx", path: "src/App.tsx", isDirectory: false },
            { name: "main.tsx", path: "src/main.tsx", isDirectory: false },
          ]
        },
        {
          name: "protocols",
          path: "protocols",
          isDirectory: true,
          children: [
            { name: "system_design.ftai", path: "protocols/system_design.ftai", isDirectory: false },
            { name: "task_log.ftai", path: "protocols/task_log.ftai", isDirectory: false },
          ]
        },
        { name: "README.md", path: "README.md", isDirectory: false },
        { name: "package.json", path: "package.json", isDirectory: false },
      ];
      setFiles(mockFiles);
    } catch (error) {
      console.error("Failed to load project files:", error);
    }
  };

  const toggleDirectory = (dirPath: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(dirPath)) {
      newExpanded.delete(dirPath);
    } else {
      newExpanded.add(dirPath);
    }
    setExpandedDirs(newExpanded);
  };

  const handleFileClick = async (filePath: string) => {
    try {
      // For now, generate mock content based on file type
      let content = "";
      if (filePath.endsWith(".ftai")) {
        content = `@ftai v2.0

@document
title: Sample FTAI Document
author: FolkTech IDE
tags: [sample, test]
@end

This is a sample .ftai file content.

@task
description: Sample task
status: pending
@end`;
      } else if (filePath.endsWith(".tsx") || filePath.endsWith(".ts")) {
        content = `// ${filePath}
import React from 'react';

// Sample TypeScript/React content
`;
      } else if (filePath.endsWith(".md")) {
        content = `# ${filePath}

Sample markdown content for the FolkTech IDE.
`;
      } else {
        content = `Sample content for ${filePath}`;
      }
      
      onFileSelect(filePath, content);
    } catch (error) {
      console.error("Failed to read file:", error);
    }
  };

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedDirs.has(node.path);
    const isFtaiFile = node.name.endsWith('.ftai');
    
    return (
      <div key={node.path} className="file-node">
        <div 
          className={`file-item ${isFtaiFile ? 'ftai-file' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => node.isDirectory ? toggleDirectory(node.path) : handleFileClick(node.path)}
        >
          <span className="file-icon">
            {node.isDirectory ? (isExpanded ? '📂' : '📁') : isFtaiFile ? '🤖' : '📄'}
          </span>
          <span className="file-name">{node.name}</span>
        </div>
        
        {node.isDirectory && isExpanded && node.children && (
          <div className="directory-children">
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <h3>Explorer</h3>
        <div className="explorer-actions">
          <button className="action-btn" title="New File">📄</button>
          <button className="action-btn" title="New Folder">📁</button>
          <button className="action-btn" title="Refresh">🔄</button>
        </div>
      </div>
      
      <div className="file-tree">
        {files.map(file => renderFileNode(file))}
      </div>
    </div>
  );
};

export default FileExplorer; 