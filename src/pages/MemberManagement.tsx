import { MemberCard } from '@/components/admin/MemberCard';
import { RequestCard } from '@/components/admin/RequestCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSelectedAravt } from '@/hooks/useSelectedAravt';
import { isUserLeaderOfAravt } from '@/lib/permissions';
import { useAdminStore } from '@/store/admin';
import { useAuthStore } from '@/store/auth';
import { Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const MemberManagement = () => {
  const { user } = useAuthStore(); 
  const { currentAravtId } = useSelectedAravt();
  const { aravtId: aravtIdParam } = useParams();
  const navigate = useNavigate();
  const aravtId = useMemo(() => {
    const n = Number(aravtIdParam);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [aravtIdParam]);
  const fallbackAravtId = currentAravtId;
  
  const { 
    members, 
    pendingRequests, 
    isLoading, 
    error, 
    // updateMemberRole,
    removeMember,
    fetchAravtData,
    fetchAravtApplications,
    approveRequest,
    rejectRequest,
    inviteMember,
  } = useAdminStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setIsInviting(true);
    try {
      if (!aravtId) return;
      await inviteMember(email, aravtId);
      setEmail('');
      setDialogOpen(false);
      toast.info('Please send the invitation email in your email client');
    } catch (error) {
      console.error('Error inviting member', error);
    } finally {
      setIsInviting(false);
    }
  };

  const isLeader = useMemo(() => isUserLeaderOfAravt(user, aravtId), [user, aravtId]);

  useEffect(() => {
    if (aravtId) {
      fetchAravtData(aravtId);
      if (isLeader) {
        fetchAravtApplications(aravtId);
      }
    }
  }, [aravtId, isLeader, fetchAravtData, fetchAravtApplications]);

  // Мягкий редирект: если нет корректного aravtId в URL, отправляем на первый доступный
  useEffect(() => {
    if (!aravtId && fallbackAravtId) {
      navigate(`/members/${fallbackAravtId}`, { replace: true });
    }
  }, [aravtId, fallbackAravtId, navigate]);



  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="">
        <div>
          <h1 className="text-2xl font-bold">Aravt Members</h1>
          <p className="text-gray-500 mb-2 ">Manage the Team of Aravt</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Invite New Member
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
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isInviting}
              >
                {isInviting ? (
                  <div className="mr-2">
                    <LoadingSpinner/>
                    Sending Invitation...
                  </div>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      

      <Card>
        <CardHeader>
          {/* <CardTitle>Aravt Management</CardTitle> */}
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="py-8 flex justify-center"><LoadingSpinner /></div>
          ) : (
            <>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search members..." 
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="SuperAdmin">Super Admin</SelectItem>
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
                aravtId={aravtId!}
                member={member}
                onRemoveMember={(userId) => aravtId ? removeMember(userId, aravtId) : Promise.resolve()}
                isLoading={isLoading}
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
            {isLoading ? (
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
                        isLoading={isLoading}
                      />
                    ))
                  )
            )}
          </CardContent>
        </Card>
      )}

      
    </div>
  );
};

export default MemberManagement; 