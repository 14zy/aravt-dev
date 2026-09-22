import JoinRequestForm from '@/components/client/JoinRequestForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { getInitials } from '@/lib/avatarUtils';
import { safeExternalUrl } from '@/lib/safeUrl';
import { useAravtsStore } from '@/store/aravts';
import { useAuthStore } from '@/store/auth';
import type { AravtDetails as AravtDetailsType, AravtMember, Project, Skill } from '@/types';
import { CheckCircle2, ExternalLink, Network, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const AravtDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [isJoining, setIsJoining] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { aravts, fetchAravts, fetchAravtDetails, applyToAravt } = useAravtsStore();
  const user = useAuthStore(state => state.user);
  const [aravtDetails, setAravtDetails] = useState<AravtDetailsType | null>(null);
  const [teamSkills, setTeamSkills] = useState<Skill[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void fetchAravts();
  }, [fetchAravts]);

  useEffect(() => {
    let isCancelled = false;

    const loadAravtDetails = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      setTeamSkills([]);
      try {
        const details = await fetchAravtDetails(parseInt(id));
        if (isCancelled) return;
        setAravtDetails(details);

        const memberResults = await Promise.allSettled(
          details.team.map(member => api.users_user(member.id)),
        );
        if (isCancelled) return;

        const skillsById = new Map<number, Skill>();
        memberResults.forEach(result => {
          if (result.status === 'fulfilled') {
            result.value.skills.forEach(skill => skillsById.set(skill.id, skill));
          }
        });
        setTeamSkills(Array.from(skillsById.values()).sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        if (isCancelled) return;
        setError('Failed to load Aravt details');
        console.error(err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void loadAravtDetails();

    return () => {
      isCancelled = true;
    };
  }, [id, fetchAravtDetails]);

  const handleJoinRequestSubmit = async (data: { reason: string }) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await applyToAravt(parseInt(id), data.reason);
      toast.success('Join request submitted successfully!');
      setIsJoining(false);
    } catch (error) {
      toast.error('Failed to submit join request');
      console.error('Failed to apply to Aravt:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !aravtDetails) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'Aravt not found'}</AlertDescription>
      </Alert>
    );
  }

  const aravtIdNum = id ? parseInt(id) : undefined;
  const isMember = user?.aravts?.some(link => link.aravt.id === (aravtIdNum ?? -1)) ?? false;
  const canJoin = !isMember && !isJoining;
  const telegramChatUrl = safeExternalUrl(aravtDetails.telegram_chat_link);
  const childAravts = aravts.filter(aravt => aravt.aravt_father_id === aravtDetails.id);

  return (
    <div className="max-w-6xl  p-2 space-y-6">

      <div className="grid gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-6">
              <Avatar className="h-[100px] w-[100px] rounded-lg">
                <AvatarFallback className="rounded-lg bg-gray-100 text-2xl">
                  {aravtDetails.name.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{aravtDetails.name}</h1>
                <p className="text-gray-500 mt-2">{aravtDetails.description}</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{aravtDetails.team.length} members</span>
                  </div>
                  <Badge variant={aravtDetails.is_draft ? "secondary" : "default"}>
                    {aravtDetails.is_draft ? 'Draft' : 'Active'}
                  </Badge>
                </div>
                {telegramChatUrl && (
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <a href={telegramChatUrl} target="_blank" rel="noopener noreferrer">
                      Open Telegram chat
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        

        {/* Leadership */}
        <Card>
          <CardHeader>
            <CardTitle>Leadership</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar>
                {aravtDetails.leader?.avatar_url && (
                  <AvatarImage src={aravtDetails.leader.avatar_url} alt={aravtDetails.leader.username} />
                )}
                <AvatarFallback>{getInitials(aravtDetails.leader?.full_name || aravtDetails.leader?.username)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{aravtDetails.leader?.username ?? '—'}</p>
                <p className="text-sm text-gray-500">Aravt Leader</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {aravtDetails.team.map((member: AravtMember) => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar>
                    {member.avatar_url && (
                      <AvatarImage src={member.avatar_url} alt={member.username} />
                    )}
                    <AvatarFallback>{getInitials(member.full_name || member.username)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.username}</p>
                    {/* TODO: отобразить роль из API, когда появится; временно показываем статус лидера */}
                    <p className="text-sm text-gray-500">{member.is_leader_of_aravt ? 'Leader' : 'Member'}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        {teamSkills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {teamSkills.map(skill => (
                  <Badge key={skill.id} variant="secondary">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects */}
        {(aravtDetails.business ?? []).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {(aravtDetails.business as Project[]).map((project: Project) => (
                  <Card key={project.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{project.name}</h3>
                          <p className="text-sm text-gray-500">{project.description}</p>
                        </div>
                        <Badge>{project.status === 'BusinessStatus.Posted' ? 'Active' : 'Not Posted'}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Offers */}
        {aravtDetails.offers?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Offers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {aravtDetails.offers.map(offer => (
                  <Card key={offer.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{offer.name}</h3>
                          <p className="text-sm text-gray-500">{offer.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${offer.price}</p>
                          {offer.is_limited && (
                            <p className="text-sm text-gray-500">
                              {offer.count_left} remaining
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Aravt Hierarchy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Hierarchy
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-500">Father Aravt</h3>
              {aravtDetails.aravt_father ? (
                <Link
                  to={`/aravts/${aravtDetails.aravt_father.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
                >
                  <span className="font-medium">
                    {aravtDetails.aravt_father.name} (№{aravtDetails.aravt_father.id})
                  </span>
                  <Badge variant={aravtDetails.aravt_father.is_draft ? 'secondary' : 'default'}>
                    {aravtDetails.aravt_father.is_draft ? 'Draft' : 'Active'}
                  </Badge>
                </Link>
              ) : (
                <p className="rounded-lg border border-dashed p-4 text-sm text-gray-500">
                  This is a root Aravt.
                </p>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-500">Child Aravts</h3>
              {childAravts.length > 0 ? (
                <div className="grid gap-3">
                  {childAravts.map(child => (
                    <Link
                      key={child.id}
                      to={`/aravts/${child.id}`}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
                    >
                      <span className="font-medium">
                        {child.name} (№{child.id})
                      </span>
                      <Badge variant={child.is_draft ? 'secondary' : 'default'}>
                        {child.is_draft ? 'Draft' : 'Active'}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed p-4 text-sm text-gray-500">
                  No child Aravts.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

      <div className="flex items-center gap-4">
          {isMember ? (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              You are already in this Aravt
            </div>
          ) : canJoin && (
            <Button
              onClick={() => setIsJoining(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Join Aravt'}
            </Button>
          )}
        </div>

      {isJoining && (
        <JoinRequestForm 
          aravtId={parseInt(id!)}
          onSubmit={handleJoinRequestSubmit}
          onClose={() => setIsJoining(false)}
        />
      )}
    </div>
  );
};

export default AravtDetails;
