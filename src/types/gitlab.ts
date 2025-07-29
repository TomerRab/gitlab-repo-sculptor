export interface GitLabCredentials {
  username: string;
  password: string;
}

export interface GitLabGroup {
  id: number;
  name: string;
  full_path: string;
}

export interface ServerConfig {
  namespace: string;
}

export interface ProjectConfig {
  name: string;
  groupId: number;
  projectType: 'library' | 'monorepo' | 'microservice' | 'delivery';
  stack?: 'maven' | 'node' | 'react' | 'spring' | 'typescript' | 'javascript' | 'vue' | 'python' | 'dotnet' | 'csharp';
  openshiftServers?: {
    a?: ServerConfig;
    b?: ServerConfig;
    c?: ServerConfig;
    d?: ServerConfig;
  };
}

export interface CreateProjectRequest extends ProjectConfig {
  credentials: GitLabCredentials;
}  