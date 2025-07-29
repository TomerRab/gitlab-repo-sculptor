export interface GitLabCredentials {
  username: string;
  password: string;
}

export interface GitLabGroup {
  id: number;
  name: string;
  full_path: string;
}

export interface ProjectConfig {
  name: string;
  groupId: number;
  projectType: 'library' | 'monorepo' | 'microservice' | 'delivery';
  stack?: 'maven' | 'node' | 'react' | 'spring' | 'typescript' | 'javascript' | 'vue' | 'python' | 'dotnet' | 'csharp';
  namespace?: string;
  openshiftServers?: {
    a?: string;
    b?: string;
    c?: string;
    d?: string;
  };
}

export interface CreateProjectRequest extends ProjectConfig {
  credentials: GitLabCredentials;
}