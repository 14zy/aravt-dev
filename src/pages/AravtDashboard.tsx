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
import {
  ArrowUpRight,
  Banknote,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Crown,
  Globe,
  Home,
  ListTodo,
  Plus,
  Search,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const ProjectCard = ({ project }: { project: Project }) => {
  const navigate = useNavigate();
  const { offers } = useOffersStore();
  const projectOffers = offers.filter(offer => offer.business.id === project.id);

  return (
    <Card className="group overflow-hidden border-slate-200 shadow-none transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
      <CardHeader className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            {project.logo && (
              <img src={project.logo} alt={`${project.name} logo`} className="mr-3 h-10 w-10 rounded-xl object-cover ring-1 ring-slate-200" />
            )}
            <div>
              <CardTitle className="text-left text-base">{project.name}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2">{project.description}</CardDescription>
            </div>
          </div>
          <Badge className="rounded-full" variant={project.status === 'BusinessStatus.Posted' ? 'default' : 'secondary'}>
            Active
          </Badge>
        </div>
      </CardHeader>
      {project.fundings && (
        <CardContent className="px-5 pb-0 pt-0">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Banknote className="h-4 w-4" />
            Fundings: {project.fundings} USD
          </div>
        </CardContent>
      )}
      <CardFooter className="flex-wrap gap-2 p-5 pt-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${project.id}`)}>
            Details
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/offers?projectId=${project.id}`)}>
            Market Offers: {projectOffers.length}
          </Button>
          <Button variant="ghost" disabled size="sm">Project Tasks</Button>
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
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('all');
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

  const filteredMembers = useMemo(() => {
    const query = memberSearchQuery.trim().toLowerCase();
    return members.filter((member) => {
      const matchesSearch = !query || [member.username, member.full_name, member.city]
        .some((value) => value?.toLowerCase().includes(query));
      const matchesRole = memberRoleFilter === 'all' ||
        (memberRoleFilter === 'leader' && member.is_leader_of_aravt) ||
        (memberRoleFilter === 'member' && !member.is_leader_of_aravt);
      return matchesSearch && matchesRole;
    });
  }, [members, memberRoleFilter, memberSearchQuery]);

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
    <div className="relative space-y-6 overflow-hidden px-0 py-0">
      <div className="pointer-events-none absolute -right-32 -top-32 -z-10 h-80 w-80 rounded-full bg-violet-100/70 blur-3xl" />
      <div className="pointer-events-none absolute left-1/4 top-96 -z-10 h-72 w-72 rounded-full bg-emerald-50 blur-3xl" />
      <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-bl from-violet-100/80 via-transparent to-transparent" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-violet-600" />
                Aravt #{currentAravt?.id ?? aravtDetails?.id}
              </Badge>
              {isLeader && <Badge className="rounded-full">Leader view</Badge>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {currentAravt?.name ?? aravtDetails?.name}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              {aravtDetails?.description || `Welcome back, ${user?.username}. Keep your team moving forward.`}
            </p>
          </div>
          {/* <div className="relative self-start">
            <Button variant="outline" size="sm" className="h-10 w-10 rounded-full p-0" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            {isLeader && pendingRequests.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                {pendingRequests.length}
              </span>
            )}
          </div> */}
        </div>
        <div className="relative mt-7 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5 sm:max-w-xl sm:gap-4">
          {[
            { label: 'Tasks', value: localTasks.length + globalTasks.length, icon: ListTodo },
            { label: 'Team', value: members.length, icon: Users },
            { label: 'Earned', value: `$${stats.tokensEarned}`, icon: CircleDollarSign },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl bg-slate-50 px-3 py-3 sm:px-4">
              <Icon className="mb-2 h-4 w-4 text-violet-600" />
              <p className="truncate text-lg font-bold text-slate-950">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </header>

      {dashboardError && (
        <Alert variant="destructive">
          <AlertDescription>{dashboardError}</AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="tasks-heading" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white shadow-sm">1</span> */}
            <div>
              <h2 id="tasks-heading" className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Aravt Tasks</h2>
              {/* <p className="text-sm text-slate-500">Find work, track progress, and move ideas forward.</p> */}
            </div>
          </div>
          <Button className="rounded-xl" size="sm" onClick={() => setShowCreateTaskForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Create task</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>

        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Task board</CardTitle>
          <CardDescription>Browse local opportunities or tasks shared across the network.</CardDescription>
        </CardHeader>
        <CardContent>
          {tasksError && (
            <Alert variant="destructive">
              <AlertDescription>{tasksError}</AlertDescription>
            </Alert>
          )}
          {showCreateTaskForm && (
            <Dialog open={showCreateTaskForm} onOpenChange={setShowCreateTaskForm}>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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
                    <Button type="submit">Create task</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          {tasksLoading ? (
            <div className="py-8 flex justify-center"><LoadingSpinner /></div>
          ) : (
            <Tabs defaultValue="local">
              <TabsList className="grid w-full grid-cols-2 rounded-xl sm:w-auto">
                <TabsTrigger value="local" className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-green-500" />
                  Local ({filteredLocalTasks.length})
                </TabsTrigger>
                <TabsTrigger value="global" className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  Global ({filteredGlobalTasks.length})
                </TabsTrigger>
              </TabsList>
              <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-slate-50 p-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search tasks..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full bg-white sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-full bg-white sm:w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
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
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
                    <div className="col-span-full rounded-xl border border-dashed py-12 text-center text-sm text-slate-500">No local tasks found.</div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="global" className="mt-4">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
                    <div className="col-span-full rounded-xl border border-dashed py-12 text-center text-sm text-slate-500">No global tasks found.</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
      </section>

      <section aria-labelledby="team-heading" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-sm">2</span> */}
            <div>
              <h2 id="team-heading" className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Our Team</h2>
              {/* <p className="text-sm text-slate-500">The people building this Aravt together.</p> */}
            </div>
          </div>
          {isLeader && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl">
                  <Plus className="mr-2 h-4 w-4" /> Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Invite a new member</DialogTitle></DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isInviting} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isInviting}>
                    {isInviting ? <span className="flex items-center gap-2"><LoadingSpinner /> Sending invitation...</span> : 'Send invitation'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">

          <div className="space-y-4">
            <Card className="rounded-2xl border-slate-200 bg-slate-950 text-white shadow-sm">
              <CardContent className="p-5">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><Crown className="h-5 w-5 text-amber-300" /></div>
                <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Aravt leader</p>
                <div className="mt-3 flex items-center gap-3">
                  <Avatar className="h-11 w-11 ring-2 ring-white/10">
                    {aravtDetails?.leader?.avatar_url && <AvatarImage src={aravtDetails.leader.avatar_url} alt={aravtDetails.leader.username} />}
                    <AvatarFallback className="bg-violet-500 text-sm text-white">{getInitials(aravtDetails?.leader?.full_name || aravtDetails?.leader?.username)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{aravtDetails?.leader?.full_name || aravtDetails?.leader?.username || 'Unassigned'}</p>
                    <p className="truncate text-xs text-slate-400">@{aravtDetails?.leader?.username ?? '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
          </div>
          
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Users className="h-5 w-5 text-emerald-600" /> Members</CardTitle>
              {/* <CardDescription>{members.length} {members.length === 1 ? 'person' : 'people'} in this Aravt</CardDescription> */}
            </CardHeader>
            <CardContent className="space-y-4">
              {membersError && <Alert variant="destructive"><AlertDescription>{membersError}</AlertDescription></Alert>}
              {membersLoading ? (
                <div className="flex justify-center py-10"><LoadingSpinner /></div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-3 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input placeholder="Search members..." className="bg-white pl-9" value={memberSearchQuery} onChange={(e) => setMemberSearchQuery(e.target.value)} />
                    </div>
                    <Select value={memberRoleFilter} onValueChange={setMemberRoleFilter}>
                      <SelectTrigger className="bg-white sm:w-[150px]"><SelectValue placeholder="Role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All roles</SelectItem>
                        <SelectItem value="leader">Leaders</SelectItem>
                        <SelectItem value="member">Members</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    {filteredMembers.map((member) => (
                      <MemberCard key={member.id} canManage={isLeader} aravtId={currentAravtId!} member={member} onRemoveMember={(userId) => currentAravtId ? removeMember(userId, currentAravtId) : Promise.resolve()} isLoading={membersLoading} />
                    ))}
                    {filteredMembers.length === 0 && <div className="rounded-xl border border-dashed py-10 text-center text-sm text-slate-500">No members match your search.</div>}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {aravtDetails?.telegram_chat_link && (
              <a href={aravtDetails.telegram_chat_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-violet-200 hover:text-violet-700">
                Open team chat <ArrowUpRight className="h-4 w-4" />
              </a>
            )}

        </div>

        {isLeader && (
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-5 w-5 text-amber-500" /> Join requests</CardTitle>
              <CardDescription>Review people who want to join your Aravt.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {membersLoading ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : pendingRequests.length === 0 ? (
                <div className="rounded-xl border border-dashed py-10 text-center text-sm text-slate-500">You’re all caught up. No pending requests.</div>
              ) : pendingRequests.map((application) => (
                <RequestCard key={application.id} request={application} onApprove={approveRequest} onReject={rejectRequest} isLoading={membersLoading} />
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      <section aria-labelledby="earnings-heading" className="space-y-8 pt-6 pb-2">
        <div className="flex items-center gap-3">
          {/* <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-sm font-bold text-white shadow-sm">3</span> */}
          <div>
            <h2 id="earnings-heading" className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Aravt Earnings</h2>
            {/* <p className="text-sm text-slate-500">Measure contribution and grow sustainable projects.</p> */}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border-0 bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-200">
            <CardContent className="p-5">
              <CircleDollarSign className="mb-6 h-6 w-6 text-violet-200" />
              <p className="text-sm text-violet-100">Total earned</p>
              <p className="mt-1 text-3xl font-bold">${stats.tokensEarned}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <Target className="mb-6 h-6 w-6 text-emerald-500" />
              <div className="flex items-end justify-between"><p className="text-sm text-slate-500">Rating</p><span className="text-xs text-slate-400">{stats.rankProgress}%</span></div>
              <p className="mt-1 text-2xl font-bold text-slate-950">Rank {stats.rank}</p>
              <Progress value={stats.rankProgress} className="mt-3 h-1.5" />
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <CheckCircle2 className="mb-6 h-6 w-6 text-amber-500" />
              <div className="flex items-end justify-between"><p className="text-sm text-slate-500">Tasks completed</p><span className="text-xs text-slate-400">{stats.totalTasks ? Math.round((stats.tasksCompleted / stats.totalTasks) * 100) : 0}%</span></div>
              <p className="mt-1 text-2xl font-bold text-slate-950">{stats.tasksCompleted}<span className="text-base font-medium text-slate-400"> / {stats.totalTasks}</span></p>
              <Progress value={stats.totalTasks ? (stats.tasksCompleted / stats.totalTasks) * 100 : 0} className="mt-3 h-1.5" />
            </CardContent>
          </Card>
        </div>

        {aravtDetails && (
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-base"><BriefcaseBusiness className="h-5 w-5 text-violet-600" /> Projects & Offers</CardTitle>
                {/* <CardDescription className="mt-1.5">The business activity behind your team’s earnings.</CardDescription> */}
              </div>
              {isLeader && currentAravtId && <CreateProjectDialog aravt_id={currentAravtId} />}
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                {projectsLoading ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : projects.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">{projects.map((project: Project) => <ProjectCard key={project.id} project={project} />)}</div>
                ) : <div className="rounded-xl border border-dashed py-10 text-center text-sm text-slate-500">No projects yet.</div>}
              </div>
              {aravtDetails.offers?.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-900">Active offers</h3><Badge variant="secondary" className="rounded-full">{aravtDetails.offers.length}</Badge></div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {aravtDetails.offers.map((offer: AravtOffer) => (
                      <div key={offer.id} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                        <div className="min-w-0"><h4 className="font-semibold text-slate-900">{offer.name}</h4><p className="mt-1 line-clamp-2 text-sm text-slate-500">{offer.description}</p>{offer.is_limited && <p className="mt-2 text-xs text-amber-600">{offer.count_left} remaining</p>}</div>
                        <div className="shrink-0 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">${offer.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {canCreateAravt && (
        <Button 
          variant="outline" 
          size="lg" 
          onClick={() => setIsFormOpen(true)}
          className="w-full rounded-2xl border-dashed py-6 text-slate-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Aravt
        </Button>
      )}

      {isFormOpen && <CreateAravtForm onClose={() => setIsFormOpen(false)} />}
    </div>
  );
};

export default AravtDashboard;
