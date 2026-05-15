import { MemberCard } from '@/components/admin/MemberCard';
import { RequestCard } from '@/components/admin/RequestCard';
import CreateAravtForm from '@/components/client/CreateAravtForm';
import { CreateProjectDialog } from '@/components/client/CreateProjectDialog';
import { TaskCard } from '@/components/client/TaskCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useSelectedAravt from '@/hooks/useSelectedAravt';
import { getInitials } from '@/lib/avatarUtils';
import { api } from '@/lib/api';
import { isUserLeaderOfAravt } from '@/lib/permissions';
import { useAdminStore } from '@/store/admin';
import { useAravtsStore } from '@/store/aravts';
import { useOffersStore } from '@/store/offers';
import { useProjectsStore } from '@/store/projects';
import { useTasksStore } from '@/store/tasks';
import { useAuthStore } from '@/store/auth';
import { useDashboardStore } from '@/store/dashboard';
import type { AravtOffer, Project, Task } from '@/types';
import { Bell, Banknote, Globe, Home, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const ProjectCard = ({ project }: { project: Project }) => {
  const navigate = useNavigate();
  const { offers } = useOffersStore();
  const projectOffers = offers.filter(offer => offer.business.id === project.id);

  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            {project.logo && (
              <img src={project.logo} alt={`${project.name} logo`} className="h-8 w-8 mr-2" />
            )}
            <div>
              <CardTitle className="text-lg text-left">{project.name}</CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </div>
          </div>
          <Badge variant={project.status === 'BusinessStatus.Posted' ? 'default' : 'secondary'}>
            Active
          </Badge>
        </div>
      </CardHeader>
      {project.fundings && (
        <CardContent className="p-4 pt-0">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Banknote className="h-4 w-4" />
            Fundings: {project.fundings} USD
          </div>
        </CardContent>
      )}
      <CardFooter className="p-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${project.id}`)}>
            Details
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/offers?projectId=${project.id}`)}>
            Market Offers: {projectOffers.length}
          </Button>
          <Button variant="outline" disabled size="sm">Project Tasks</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const AravtDashboard = () => {
  const { stats, isLoading: dashboardLoading, error: dashboardError, fetchDashboardData } = useDashboardStore();
  const { aravtDetails, isLoading: aravtLoading } = useAravtsStore();
  const user = useAuthStore(state => state.user);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [businesses, setBusinesses] = useState<Project[]>([]);
  const params = useParams();
  const navigate = useNavigate();
  const { currentAravtId, setCurrentAravtId, currentAravt } = useSelectedAravt();
  const {
    members,
    pendingRequests,
    isLoading: membersLoading,
    error: membersError,
    removeMember,
    fetchAravtData,
    fetchAravtApplications,
    approveRequest,
    rejectRequest,
    inviteMember,
  } = useAdminStore();

  const { projects, isLoading: projectsLoading, fetchProjectsForAravt } = useProjectsStore();
  const { fetchOffers } = useOffersStore();
  const { localTasks, globalTasks, isLoading: tasksLoading, error: tasksError, fetchTasksData, updateTaskIsDone } = useTasksStore();

  const urlAravtId = useMemo((): number | undefined => {
    if (!params.aravtId) return undefined;
    const parsed = Number(params.aravtId);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [params.aravtId]);

  const canCreateAravt = useMemo((): boolean => {
    if (!user?.aravts || user.aravts.length === 0) return false;
    if (currentAravtId) {
      return user.aravts.some(link => link.aravt.id === currentAravtId && link.able_to_create_aravt);
    }
    return user.aravts.some(link => link.able_to_create_aravt);
  }, [user?.aravts, currentAravtId]);

  const isLeader = useMemo(() => isUserLeaderOfAravt(user, currentAravtId), [user, currentAravtId]);

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.currentTarget);
      const responsibleUsers = formData.get('responsible_users_ids') as string;
      const responsible_users_ids = responsibleUsers
        ? responsibleUsers.trim().startsWith('[')
          ? JSON.parse(responsibleUsers)
          : responsibleUsers.split(',').map((id) => Number(id.trim()))
        : [];
      const taskData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        link: (formData.get('link') as string) || '',
        reward: Math.floor(Number(formData.get('reward'))),
        reward_type: (formData.get('reward_type') === 'AT' ? 'AT' : 'USDT') as 'AT' | 'USDT',
        definition_of_done: JSON.parse((formData.get('definition_of_done') as string) || '{}'),
        responsible_users_ids,
        is_done: false,
        is_global: formData.get('is_global') === 'true',
        date_time: formData.get('deadline') as string,
        priority: formData.get('priority') as 'low' | 'medium' | 'high',
        one_time: formData.get('one_time') === 'true',
        business_id: formData.get('business_id') ? Number(formData.get('business_id')) : undefined,
        completions: { completions_amount: 0, is_completion_approved: false, num_of_approved: 0 },
      };
      if (!currentAravtId) throw new Error('No aravt selected');
      await api.tasks_set_task(currentAravtId, taskData);
      await fetchTasksData();
      setShowCreateTaskForm(false);
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const filterTasks = useCallback(
    (tasks: Task[]) => tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'completed' && task.is_done) ||
        (statusFilter === 'open' && !task.is_done);
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    }),
    [searchQuery, statusFilter, priorityFilter],
  );

  const filteredLocalTasks = useMemo(() => filterTasks(localTasks), [localTasks, filterTasks]);
  const filteredGlobalTasks = useMemo(() => filterTasks(globalTasks), [globalTasks, filterTasks]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }
    setIsInviting(true);
    try {
      if (!currentAravtId) return;
      await inviteMember(email, currentAravtId);
      setEmail('');
      setDialogOpen(false);
      toast.info('Please send the invitation email in your email client');
    } catch (error) {
      console.error('Error inviting member', error);
    } finally {
      setIsInviting(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    if (urlAravtId && urlAravtId !== currentAravtId) {
      setCurrentAravtId(urlAravtId);
    } else if (!currentAravtId && user?.aravts?.length) {
      navigate(`/dashboard/${user.aravts[0].aravt.id}`, { replace: true });
    }
  }, [fetchDashboardData, urlAravtId, currentAravtId, setCurrentAravtId, navigate, user?.aravts]);

  useEffect(() => {
    if (currentAravtId) {
      fetchAravtData(currentAravtId);
      if (isLeader) {
        fetchAravtApplications(currentAravtId);
      }
    }
  }, [currentAravtId, isLeader, fetchAravtData, fetchAravtApplications]);

  useEffect(() => {
    if (currentAravtId) {
      fetchProjectsForAravt(currentAravtId);
      fetchOffers();
    }
  }, [currentAravtId, fetchProjectsForAravt, fetchOffers]);

  useEffect(() => {
    fetchTasksData();
  }, [fetchTasksData]);

  useEffect(() => {
    const fetchBusinesses = async () => {
      if (currentAravtId) {
        try {
          const aravtData = await api.aravt_aravt(currentAravtId);
          setBusinesses(aravtData.business || []);
        } catch (err) {
          console.error('Error fetching businesses:', err);
        }
      }
    };
    fetchBusinesses();
  }, [currentAravtId]);

  if (dashboardLoading || aravtLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{(currentAravt?.name) ?? aravtDetails?.name} (#{(currentAravt?.id) ?? aravtDetails?.id})</h1>
          <p className="text-gray-500"><b>{user?.username}</b> dashboard</p>
        </div>
        <div className="relative">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
          {isLeader && pendingRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </div>
      </div>

      {dashboardError && (
        <Alert variant="destructive">
          <AlertDescription>{dashboardError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Leadership</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              {aravtDetails?.leader?.avatar_url && (
                <AvatarImage src={aravtDetails.leader.avatar_url} alt={aravtDetails.leader.username} />
              )}
              <AvatarFallback className="text-xs">{getInitials(aravtDetails?.leader?.full_name || aravtDetails?.leader?.username)}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-medium">{aravtDetails?.leader?.username ?? '—'}</p>
              <p className="text-xs text-muted-foreground">Aravt Leader</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Team Members</CardTitle>
            {isLeader && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite New Member</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleInvite} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email address to send invite:</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isInviting}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isInviting}>
                      {isInviting ? (
                        <div className="mr-2 flex items-center gap-2">
                          <LoadingSpinner />
                          Sending Invitation...
                        </div>
                      ) : (
                        'Send Invitation'
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {membersError && (
            <Alert variant="destructive">
              <AlertDescription>{membersError}</AlertDescription>
            </Alert>
          )}
          {membersLoading ? (
            <div className="py-8 flex justify-center"><LoadingSpinner /></div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search members..." className="pl-9" />
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="AravtLeader">Aravt Leader</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                {members.map((member) => (
                  <MemberCard
                    key={member.id}
                    canManage={isLeader}
                    aravtId={currentAravtId!}
                    member={member}
                    onRemoveMember={(userId) => currentAravtId ? removeMember(userId, currentAravtId) : Promise.resolve()}
                    isLoading={membersLoading}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {isLeader && (
        <Card>
          <CardHeader>
            <CardTitle>Requests to Join your Aravt:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {membersLoading ? (
              <div className="py-8 flex justify-center"><LoadingSpinner /></div>
            ) : (
              pendingRequests.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No new join requests at the moment.</div>
              ) : (
                pendingRequests.map((application) => (
                  <RequestCard
                    key={application.id}
                    request={application}
                    onApprove={approveRequest}
                    onReject={rejectRequest}
                    isLoading={membersLoading}
                  />
                ))
              )
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tasks</CardTitle>
            <Button size="sm" onClick={() => setShowCreateTaskForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tasksError && (
            <Alert variant="destructive">
              <AlertDescription>{tasksError}</AlertDescription>
            </Alert>
          )}
          {showCreateTaskForm && (
            <Dialog open={showCreateTaskForm} onOpenChange={setShowCreateTaskForm}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTask}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input id="title" name="title" required />
                    </div>
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea id="description" name="description" required />
                    </div>
                    <div>
                      <Label htmlFor="link">URL</Label>
                      <Input id="link" name="link" placeholder="https://" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select name="priority" defaultValue="medium">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="is_global">Visibility</Label>
                        <Select name="is_global" defaultValue="false">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">Local</SelectItem>
                            <SelectItem value="true">Global</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="one_time">Completions</Label>
                        <Select name="one_time" defaultValue="true">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">One Completion</SelectItem>
                            <SelectItem value="false">Many Completions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="reward">Reward amount *</Label>
                        <div className="flex gap-2">
                          <Input id="reward" name="reward" type="number" step="1" min="0" required placeholder="0" defaultValue={1} className="flex-1" />
                          <div className="w-24">
                            <Select name="reward_type" defaultValue="AT">
                              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AT">AT</SelectItem>
                                <SelectItem value="USDT">USDT</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <div hidden>
                        <Label htmlFor="deadline">Deadline</Label>
                        <Input id="deadline" name="deadline" type="datetime-local" />
                      </div>
                    </div>
                    <div className="space-y-4 pt-2 border-t">
                      <div>
                        <Label htmlFor="business_id">Project</Label>
                        <Select name="business_id">
                          <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="project_id">All</SelectItem>
                            {businesses.map((business) => (
                              <SelectItem key={business.id} value={business.id.toString()}>
                                {business.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input id="definition_of_done" name="definition_of_done" defaultValue="{}" type="hidden" />
                      <Input id="responsible_users_ids" name="responsible_users_ids" type="hidden" />
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => setShowCreateTaskForm(false)}>Cancel</Button>
                    <Button type="submit">Create Task</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          {tasksLoading ? (
            <div className="py-8 flex justify-center"><LoadingSpinner /></div>
          ) : (
            <Tabs defaultValue="local">
              <TabsList>
                <TabsTrigger value="local" className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-green-500" />
                  Local ({filteredLocalTasks.length})
                </TabsTrigger>
                <TabsTrigger value="global" className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  Global ({filteredGlobalTasks.length})
                </TabsTrigger>
              </TabsList>
              <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search tasks..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <TabsContent value="local" className="mt-4">
                <div className="grid grid-cols-1 gap-4">
                  {filteredLocalTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdate={async (taskId, updates) => {
                        await updateTaskIsDone(taskId, updates.is_done || false);
                        await fetchTasksData();
                      }}
                      isLoading={tasksLoading}
                    />
                  ))}
                  {filteredLocalTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No local tasks found</div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="global" className="mt-4">
                <div className="grid grid-cols-1 gap-4">
                  {filteredGlobalTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdate={async (taskId, updates) => {
                        await updateTaskIsDone(taskId, updates.is_done || false);
                        await fetchTasksData();
                      }}
                      isLoading={tasksLoading}
                    />
                  ))}
                  {filteredGlobalTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No global tasks found</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">{aravtDetails?.description}</p>
          {/*
            TODO: вернуть навыки, когда API снова начнет возвращать skills
            <div className="flex flex-wrap gap-1">
              {aravtDetails?.skills?.map((skill: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
              ))}
            </div>
          */}
        </CardContent>
      </Card>

      {aravtDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Business</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text font-bold text-gray-500">Projects</h4>
                {isLeader && <CreateProjectDialog aravt_id={currentAravtId!} />}
              </div>
              {projectsLoading ? (
                <div className="py-4 flex justify-center"><LoadingSpinner /></div>
              ) : (
                <div className="grid gap-2">
                  {projects.map((project: Project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </div>

            {aravtDetails.offers?.length > 0 && (
              <div>
                <h4 className="pt-2 text-sm font-medium text-gray-500">Our Offers</h4>
                <div className="grid gap-2 mt-2">
                  {aravtDetails.offers.map((offer: AravtOffer) => (
                    <Card key={offer.id} className="p-4">
                      <div className="">
                        <div>
                          <h5 className="font-medium">{offer.name}</h5>
                          <p className="text-sm text-gray-500">{offer.description}</p>
                        </div>
                        <div className="text-center">
                          <div className="font-bold pt-2">{"$" + offer.price}</div>
                          {offer.is_limited && (
                            <div className="text-sm text-gray-500">
                              {offer.count_left} remaining
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {aravtDetails.telegram_chat_link && (
              <div>
                <h4 className="text-sm pt-2 font-medium text-gray-500">Telegram Chat</h4>
                <a 
                  href={aravtDetails.telegram_chat_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Open Telegram Chat
                </a>
              </div>
            )}

          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-1">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-sm text-muted-foreground">Earned</p>
              <p className="text-lg font-semibold">${stats.tokensEarned}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rating</p>
              <p className="text-lg font-semibold">Rank {stats.rank}</p>
              <Progress value={stats.rankProgress} className="h-1 mt-1" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tasks</p>
              <p className="text-lg font-semibold">{stats.tasksCompleted}/{stats.totalTasks}</p>
              <Progress value={(stats.tasksCompleted / stats.totalTasks) * 100} className="h-1 mt-1" />
            </div>
            
            
          </div>
        </CardContent>
      </Card>

      

      {canCreateAravt && (
        <Button 
          variant="outline" 
          size="lg" 
          onClick={() => setIsFormOpen(true)}
          className="w-full"
        >
          Create New Aravt
        </Button>
      )}

      {isFormOpen && <CreateAravtForm onClose={() => setIsFormOpen(false)} />}
    </div>
  );
};

export default AravtDashboard; 