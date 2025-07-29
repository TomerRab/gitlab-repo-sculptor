import { GitLabCredentials, GitLabGroup, CreateProjectRequest } from '@/types/gitlab';

const API_BASE_URL = 'http://localhost:3001/api'; // Replace with your backend URL

export const gitlabApi = {
  // Validate GitLab credentials
  validateCredentials: async (credentials: GitLabCredentials): Promise<boolean> => {
    const response = await fetch(`${API_BASE_URL}/gitlab/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      throw new Error('Failed to validate credentials');
    }
    
    return response.json();
  },

  // Get user's GitLab groups
  getGroups: async (credentials: GitLabCredentials): Promise<GitLabGroup[]> => {
    const response = await fetch(`${API_BASE_URL}/gitlab/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch groups');
    }
    
    return response.json();
  },

  // Create project
  createProject: async (projectData: CreateProjectRequest): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/gitlab/create-project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create project');
    }
    
    return response.json();
  },
};