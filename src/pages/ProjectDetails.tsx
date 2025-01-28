import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Bell, Settings, CreditCard, Users, CalendarDays, 
  Globe, ListChecks, Plus 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useOffersStore } from '@/store/offers';

interface ProjectMockData {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'planning' | 'completed';
  progress: number;
  taskCount: number;
  memberCount: number;
  funding: string;
  stats: {
    tasksCompleted: number;
    totalTasks: number;
    tokensEarned: number;
    usdtEarned: number;
    progress: number;
  };
  teamMembers: Array<{
    id: number;
    name: string;
    role: string;
    tasksCompleted: number;
    status: 'online' | 'offline';
  }>;
}

// Mock data - replace with actual API calls
const mockProject: ProjectMockData = {
  id: 1,
  name: 'DeFi Protocol',
  description: 'Building decentralized exchange platform',
  status: 'active',
  progress: 65,
  taskCount: 8,
  memberCount: 5,
  funding: '50000 USDT',
  stats: {
    tasksCompleted: 12,
    totalTasks: 15,
    tokensEarned: 2450,
    usdtEarned: 1200,
    progress: 65,
  },
  teamMembers: [
    {
      id: 1,
      name: 'Alex Chen',
      role: 'Project Lead',
      tasksCompleted: 8,
      status: 'online',
    },
    {
      id: 2,
      name: 'Maria Garcia',
      role: 'Smart Contract Dev',
      tasksCompleted: 6,
      status: 'offline',
    },
  ],
};

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { offers } = useOffersStore();
  const navigate = useNavigate();

  // Filter offers for this project
  const projectOffers = offers.filter(offer => offer.project?.id === Number(id));

  useEffect(() => {
    // TODO: Fetch project details
  }, [id]);

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-xl mx-auto mt-8 space-y-6">
      <div className="flex justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{mockProject.name}</h1>
            <Badge variant={mockProject.status === 'active' ? 'default' : 'secondary'}>
              {mockProject.status}
            </Badge>
          </div>
          <p className="text-gray-500 max-w-2xl">{mockProject.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tasks Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockProject.stats.tasksCompleted}/{mockProject.stats.totalTasks}
            </div>
            <Progress 
              value={(mockProject.stats.tasksCompleted / mockProject.stats.totalTasks) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Team Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              {mockProject.teamMembers.length} members
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-500" />
              {mockProject.funding}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockProject.stats.progress}%</div>
            <Progress value={mockProject.stats.progress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-3">
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Add activity feed here */}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Project Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Add project stats here */}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tasks" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Project Tasks</h3>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {/* Add tasks list here */}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="files" className="mt-6">
                  {/* Add files section here */}
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                  {/* Add settings section here */}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockProject.teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.role}</div>
                    </div>
                  </div>
                  <Badge variant={member.status === 'online' ? 'default' : 'secondary'}>
                    {member.status}
                  </Badge>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Project Offers</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/offers')}>
                View All Offers
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {projectOffers.length > 0 ? (
                projectOffers.map((offer) => (
                  <Card key={offer.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{offer.name}</CardTitle>
                      <CardDescription>{offer.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="font-medium">Price: ${offer.price}</p>
                        {offer.is_limited && (
                          <p className="text-amber-600">
                            {offer.count_left} spots remaining
                          </p>
                        )}
                        <p>Duration: {offer.duration} days</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500">No offers available for this project</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <ListChecks className="h-4 w-4 mr-2" />
                View Task Board
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <CalendarDays className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Globe className="h-4 w-4 mr-2" />
                Project Website
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectDetails; 