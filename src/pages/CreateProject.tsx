import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { gitlabApi } from '@/lib/api';
import { GitLabGroup } from '@/types/gitlab';
import { ArrowLeft, GitBranch } from 'lucide-react';
import { useState, useEffect } from 'react';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  groupId: z.number().min(1, 'Group selection is required'),
  projectType: z.enum(['library', 'monorepo', 'microservice', 'delivery']),
  stack: z.enum(['maven', 'node', 'react', 'spring', 'typescript', 'javascript', 'vue', 'python', 'dotnet', 'csharp']).optional(),
  namespace: z.string().optional(),
  openshiftServerA: z.string().optional(),
  openshiftServerB: z.string().optional(),
  openshiftServerC: z.string().optional(),
  openshiftServerD: z.string().optional(),
});

type ProjectForm = z.infer<typeof projectSchema>;

const CreateProject = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { credentials } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState<GitLabGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const form = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      groupId: 0,
      projectType: 'library',
    },
  });

  const projectType = form.watch('projectType');

  useEffect(() => {
    if (!credentials) {
      navigate('/');
      return;
    }
    loadGroups();
  }, [credentials, navigate]);

  const loadGroups = async () => {
    if (!credentials) return;
    
    setLoadingGroups(true);
    try {
      const gitlabGroups = await gitlabApi.getGroups(credentials);
      setGroups(gitlabGroups);
    } catch (error) {
      toast({
        title: 'Failed to load groups',
        description: 'Unable to fetch GitLab groups',
        variant: 'destructive',
      });
    } finally {
      setLoadingGroups(false);
    }
  };

  const requiresStack = projectType !== 'delivery';
  const requiresDeployment = projectType === 'delivery' || projectType === 'monorepo';

  const onSubmit = async (data: ProjectForm) => {
    if (!credentials) return;
    
    setIsLoading(true);
    try {
      const projectData = {
        name: data.name,
        groupId: data.groupId,
        projectType: data.projectType,
        stack: data.stack,
        namespace: data.namespace,
        credentials,
        openshiftServers: {
          a: data.openshiftServerA,
          b: data.openshiftServerB,
          c: data.openshiftServerC,
          d: data.openshiftServerD,
        },
      };

      await gitlabApi.createProject(projectData);
      toast({
        title: 'Project created successfully',
        description: `${data.name} has been created with all configurations`,
      });
      form.reset();
    } catch (error) {
      toast({
        title: 'Failed to create project',
        description: 'Please check your configuration and try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GitBranch className="h-6 w-6 text-primary" />
              <CardTitle>Create New GitLab Project</CardTitle>
            </div>
            <CardDescription>
              Configure your new repository with the tools and settings your team needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="my-awesome-project" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="groupId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitLab Group</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        disabled={loadingGroups}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue 
                              placeholder={loadingGroups ? "Loading groups..." : "Select a group"} 
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groups.map((group) => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                              {group.full_path}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="library" id="library" />
                            <Label htmlFor="library">Library</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="monorepo" id="monorepo" />
                            <Label htmlFor="monorepo">Monorepo</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="microservice" id="microservice" />
                            <Label htmlFor="microservice">Microservice</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="delivery" id="delivery" />
                            <Label htmlFor="delivery">Delivery Repo</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>
                        {projectType === 'library' && 'A reusable library component'}
                        {projectType === 'monorepo' && 'Microservice with Helm chart included'}
                        {projectType === 'microservice' && 'Microservice without Helm chart, part of delivery'}
                        {projectType === 'delivery' && 'Deployment repository for managing releases'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {requiresStack && (
                  <FormField
                    control={form.control}
                    name="stack"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Technology Stack</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select technology stack" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="maven">Maven</SelectItem>
                            <SelectItem value="node">Node.js</SelectItem>
                            <SelectItem value="react">React App</SelectItem>
                            <SelectItem value="spring">Spring</SelectItem>
                            <SelectItem value="typescript">TypeScript</SelectItem>
                            <SelectItem value="javascript">JavaScript</SelectItem>
                            <SelectItem value="vue">Vue.js</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                            <SelectItem value="dotnet">.NET</SelectItem>
                            <SelectItem value="csharp">C#</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {requiresDeployment && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Deployment Configuration</h3>
                    
                    <FormField
                      control={form.control}
                      name="namespace"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deployment Namespace</FormLabel>
                          <FormControl>
                            <Input placeholder="my-app-namespace" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="openshiftServerA"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>OpenShift Server A</FormLabel>
                            <FormControl>
                              <Input placeholder="https://cluster-a.example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="openshiftServerB"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>OpenShift Server B</FormLabel>
                            <FormControl>
                              <Input placeholder="https://cluster-b.example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="openshiftServerC"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>OpenShift Server C</FormLabel>
                            <FormControl>
                              <Input placeholder="https://cluster-c.example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="openshiftServerD"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>OpenShift Server D</FormLabel>
                            <FormControl>
                              <Input placeholder="https://cluster-d.example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating Project...' : 'Create Project'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateProject;