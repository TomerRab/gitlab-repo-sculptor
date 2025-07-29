import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { gitlabApi } from '@/lib/api';
import { GitlabIcon } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setCredentials } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    
    // Mock authentication - skip API call for now
    setTimeout(() => {
      const credentials = { username: data.username, password: data.password };
      setCredentials(credentials);
      toast({
        title: 'Authentication successful',
        description: 'Welcome to GitLab Project Creator',
      });
      navigate('/create-project');
      setIsLoading(false);
    }, 1000);
    
    /* TODO: Replace with actual API call later
    try {
      const credentials = { username: data.username, password: data.password };
      const isValid = await gitlabApi.validateCredentials(credentials);
      if (isValid) {
        setCredentials(credentials);
        toast({
          title: 'Authentication successful',
          description: 'Welcome to GitLab Project Creator',
        });
        navigate('/create-project');
      }
    } catch (error) {
      toast({
        title: 'Authentication failed',
        description: 'Please check your credentials and try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
    */
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <GitlabIcon className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">GitLab Project Creator</CardTitle>
          <CardDescription>
            Enter your GitLab credentials to create and configure repositories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitLab Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your GitLab username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;