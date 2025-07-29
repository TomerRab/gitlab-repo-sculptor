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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { gitlabApi } from '@/lib/api';
import { GitLabGroup } from '@/types/gitlab';
import { ArrowLeft, GitBranch, Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo, useCallback } from 'react';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  groupId: z.number().min(1, 'Group selection is required'),
  projectType: z.enum(['library', 'monorepo', 'microservice', 'delivery']),
  stack: z.enum(['maven', 'node', 'react', 'spring', 'typescript', 'javascript', 'vue', 'python', 'dotnet', 'csharp']).optional(),
  openshiftServers: z.object({
    a: z.object({ namespace: z.string().min(1, 'Namespace is required') }).optional(),
    b: z.object({ namespace: z.string().min(1, 'Namespace is required') }).optional(),
    c: z.object({ namespace: z.string().min(1, 'Namespace is required') }).optional(),
    d: z.object({ namespace: z.string().min(1, 'Namespace is required') }).optional(),
  }).optional(),
});

type ProjectForm = z.infer<typeof projectSchema>;

const CreateProject = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { credentials } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState<GitLabGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<GitLabGroup[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Cache for search results to avoid repeat API calls
  const searchCache = useMemo(() => new Map<string, GitLabGroup[]>(), []);

  const form = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      groupId: 0,
      projectType: 'library',
      openshiftServers: {},
    },
  });

  const projectType = form.watch('projectType');
  const openshiftServers = form.watch('openshiftServers') || {};
  
  const servers = [
    { key: 'a' as const, label: 'Server A' },
    { key: 'b' as const, label: 'Server B' },
    { key: 'c' as const, label: 'Server C' },
    { key: 'd' as const, label: 'Server D' },
  ];

  const isServerSelected = (serverKey: 'a' | 'b' | 'c' | 'd') => {
    return !!openshiftServers[serverKey];
  };

  const toggleServer = (serverKey: 'a' | 'b' | 'c' | 'd', checked: boolean) => {
    const currentServers = form.getValues('openshiftServers') || {};
    if (checked) {
      form.setValue('openshiftServers', {
        ...currentServers,
        [serverKey]: { namespace: '' }
      });
    } else {
      const { [serverKey]: removed, ...remainingServers } = currentServers;
      form.setValue('openshiftServers', remainingServers);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    (term: string) => {
      const timeoutId = setTimeout(async () => {
        if (term.length >= 3 && credentials) {
          // Check cache first
          if (searchCache.has(term)) {
            setSearchResults(searchCache.get(term)!);
            setIsSearching(false);
            return;
          }

          try {
            setIsSearching(true);
            const results = await gitlabApi.searchGroups(credentials, term);
            searchCache.set(term, results);
            setSearchResults(results);
          } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
          } finally {
            setIsSearching(false);
          }
        } else {
          setSearchResults([]);
          setIsSearching(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [credentials, searchCache]
  );

  // Combined groups: common groups + search results (deduplicated)
  const displayGroups = useMemo(() => {
    if (searchTerm.length >= 3) {
      // Show search results, but also include any common groups that match
      const commonMatches = groups.filter(g => 
        g.full_path.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Deduplicate by ID
      const combined = [...commonMatches, ...searchResults];
      const unique = combined.filter((group, index, self) => 
        self.findIndex(g => g.id === group.id) === index
      );
      
      return unique;
    }
    
    return groups; // Show common groups
  }, [groups, searchResults, searchTerm]);

  // Handle search input changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (value.length >= 3) {
      setIsSearching(true);
      debouncedSearch(value);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [debouncedSearch]);

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
      // Load common/recent groups first (fast loading)
      const commonGroups = await gitlabApi.getCommonGroups(credentials, 200);
      setGroups(commonGroups);
    } catch (error) {
      console.error('Failed to load common groups:', error);
      // Fallback to mock data in development
      const mockGroups = [
        { id: 1, name: 'frontend-team', full_path: 'company/frontend-team' },
        { id: 2, name: 'backend-team', full_path: 'company/backend-team' },
        { id: 3, name: 'devops-team', full_path: 'company/devops-team' },
        { id: 4, name: 'platform-team', full_path: 'company/platform-team' },
        { id: 5, name: 'mobile-team', full_path: 'company/mobile-team' },
        { id: 6, name: 'qa-team', full_path: 'company/qa-team' },
      ];
      setGroups(mockGroups);
      
      toast({
        title: 'Using offline mode',
        description: 'Showing sample groups. Backend connection needed for full functionality.',
        variant: 'default',
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
      // Filter out servers without namespaces and ensure namespace is not empty
      const validServers: { [key: string]: { namespace: string } } = {};
      if (data.openshiftServers) {
        Object.entries(data.openshiftServers).forEach(([key, server]) => {
          if (server && server.namespace && server.namespace.trim()) {
            validServers[key] = { namespace: server.namespace.trim() };
          }
        });
      }

      const projectData = {
        name: data.name,
        groupId: data.groupId,
        projectType: data.projectType,
        stack: data.stack,
        openshiftServers: Object.keys(validServers).length > 0 ? validServers : undefined,
        credentials,
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
                      <Popover open={groupOpen} onOpenChange={setGroupOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={groupOpen}
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={loadingGroups}
                            >
                              {field.value
                                ? displayGroups.find((group) => group.id === field.value)?.full_path
                                : loadingGroups ? "Loading groups..." : "Search and select group..."
                              }
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search groups..." 
                              value={searchTerm}
                              onValueChange={handleSearchChange}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {isSearching ? "Searching server..." : 
                                searchTerm.length >= 3 ? "No groups found." : 
                                searchTerm.length > 0 ? "Type at least 3 characters for server search" :
                                "Start typing to search groups"}
                              </CommandEmpty>
                              <CommandGroup>
                                {displayGroups.map((group) => (
                                  <CommandItem
                                    key={group.id}
                                    value={group.full_path}
                                    onSelect={() => {
                                      field.onChange(group.id);
                                      setGroupOpen(false);
                                      setSearchTerm('');
                                      setSearchResults([]);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === group.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {group.full_path}
                                    {searchTerm.length >= 3 && searchResults.some(r => r.id === group.id) && (
                                      <span className="ml-auto text-xs text-muted-foreground bg-muted px-1 rounded">server result</span>
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Common groups are shown immediately. Type 3+ characters to search server for additional groups.
                      </FormDescription>  
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
                    <p className="text-sm text-muted-foreground">Select the OpenShift servers and provide a namespace for each.</p>
                    
                    <div className="space-y-4">
                      {servers.map((server) => (
                        <div key={server.key} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`server-${server.key}`}
                              checked={isServerSelected(server.key)}
                              onCheckedChange={(checked) => toggleServer(server.key, checked as boolean)}
                            />
                            <Label htmlFor={`server-${server.key}`}>{server.label}</Label>
                          </div>
                          
                          {isServerSelected(server.key) && (
                            <FormField
                              control={form.control}
                              name={`openshiftServers.${server.key}.namespace`}
                              render={({ field }) => (
                                <FormItem className="ml-6">
                                  <FormLabel>Namespace for {server.label}</FormLabel>
                                  <FormControl>
                                    <Input placeholder={`${server.key}-namespace`} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      ))}
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