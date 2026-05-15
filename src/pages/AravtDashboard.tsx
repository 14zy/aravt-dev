import { MemberCard } from '@/components/admin/MemberCard';
import { RequestCard } from '@/components/admin/RequestCard';
import CreateAravtForm from '@/components/client/CreateAravtForm';
import { CreateProjectDialog } from '@/components/client/CreateProjectDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useSelectedAravt from '@/hooks/useSelectedAravt';
import { getInitials } from '@/lib/avatarUtils';
import { isUserLeaderOfAravt } from '@/lib/permissions';
import { useAdminStore } from '@/store/admin';
import { useAravtsStore } from '@/store/aravts';
import { useOffersStore } from '@/store/offers';
import { useProjectsStore } from '@/store/projects';
import { useAuthStore } from '@/store/auth';
import { useDashboardStore } from '@/store/dashboard';
import type { AravtOffer, Project, UserShort } from '@/types';
import { Banknote, ListTodo, Plus, Search, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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

const StatCard = ({ title, value, icon: Icon, progress }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  progress?: number;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      {progress !== undefined && (
        <Progress value={progress} className="h-1 mt-2" />
      )}
    </CardContent>
  </Card>
);

const ActivityFeed = () => (
  <Card>
    <CardHeader>
      <CardTitle>Recent Activity</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <div>
          <Avatar className="h-10 w-10">
            <AvatarFallback>U1</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1">
          <p className="font-medium">New task completed</p>
          <p className="text-gray-500">User completed Task #123</p>
        </div>
        <span className="text-gray-400 text-xs">2h ago</span>
      </div>
    </CardContent>
  </Card>
);

const QuickActions = () => (
  /* To do
  <Card>
    <CardHeader>
      <CardTitle>Quick Actions</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <Button variant="outline">
        <span className="flex items-center">
          <Users className="mr-2 h-4 w-4" />
          Manage Team
        </span>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="outline">
        <span className="flex items-center">
          <ListTodo className="mr-2 h-4 w-4" />
          Create Task
        </span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </CardContent>
  </Card>
  */
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm">Quick Actions</CardTitle>
    </CardHeader>
    <CardContent className="space-y-1">
      <Button variant="outline" size="sm" className="w-full justify-start text-sm">
        <Users className="mr-2 h-3 w-3" />
        Manage Team
      </Button>
      <Button variant="outline" size="sm" className="w-full justify-start text-sm">
        <ListTodo className="mr-2 h-3 w-3" />
        Create Task
      </Button>
    </CardContent>
  </Card>
);

const AravtDashboard = () => {
  const { stats, isLoading: dashboardLoading, error: dashboardError, fetchDashboardData } = useDashboardStore();
  const { aravtDetails, isLoading: aravtLoading } = useAravtsStore();
  const user = useAuthStore(state => state.user);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
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

  if (dashboardLoading || aravtLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mx-auto py-4 px-3 space-y-4">
      <div className=" items-center">
        <div>
          <h1 className="text-2xl font-bold">{(currentAravt?.name) ?? aravtDetails?.name} (#{(currentAravt?.id) ?? aravtDetails?.id})</h1>
          <p className="text-gray-500"><b>{user?.username}</b> dashboard</p>
        </div>
        {/* <div className="flex gap-1">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div> */}
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

      

      {/* <QuickActions /> */}

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