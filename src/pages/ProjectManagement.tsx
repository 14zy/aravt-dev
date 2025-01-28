import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useProjectsStore } from '@/store/projects';
import { Project } from "@/types";
import { CreateProjectDialog } from '@/components/client/CreateProjectDialog';
import { useOffersStore } from '@/store/offers';
import TaskBoard from '@/components/client/TaskBoard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ProjectCard = ({ project }: { project: Project }) => {
  const navigate = useNavigate();
  const { offers } = useOffersStore();
  
  // Get offers count for this project
  const projectOffers = offers.filter(offer => offer.project?.id === project.id);

  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            {project.logo && (
              <img src={project.logo} alt={`${project.name} logo`} className="h-8 w-8 mr-2" />
            )}
            <div>
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </div>
          </div>
          <Badge variant={project.Status === 'Posted' ? 'default' : 'secondary'}>
            {project.Status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              {project.fundings && (
                <div>
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  {project.fundings[0]?.amount} {project.fundings[0]?.currency}
                </div>
              )}
              <div>
                <Badge variant="secondary">
                  {projectOffers.length} Offers
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            View Details
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/offers?projectId=${project.id}`)}
          >
            View Offers
          </Button>
          <Button variant="outline" size="sm">Task Board</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const ProjectManagement = () => {
  const navigate = useNavigate();
  const { user, aravt } = useAuthStore();
  const { projects, isLoading, error, fetchProjectsForAravt } = useProjectsStore();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !user.aravt?.id) {
      navigate('/login');
      return;
    }
    fetchProjectsForAravt(user?.aravt?.id);
  }, [user, fetchProjectsForAravt, navigate]);

  if (!user || !aravt || isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-gray-500">Manage your Aravt projects</p>
        </div>
        <CreateProjectDialog aravt_id={aravt.id}/>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="board" className="w-full">
        <TabsList>
          <TabsTrigger value="board">Task Board</TabsTrigger>
          <TabsTrigger value="list">Project List</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-end">
              <select 
                className="border rounded p-2"
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">All Projects</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <Card>
              <CardContent className="p-6">
                <TaskBoard projectId={selectedProjectId || undefined} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <div className="grid grid-cols-1 gap-4">
            {projects?.map((project: Project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectManagement; 