import JoinRequestForm from '@/components/client/JoinRequestForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAravtsStore } from '@/store/aravts';
import { useAuthStore } from '@/store/auth';
import type { AravtDetails as AravtDetailsType, AravtMember, Project } from '@/types';
import { Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const AravtDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [isJoining, setIsJoining] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchAravtDetails, applyToAravt } = useAravtsStore();
  const user = useAuthStore(state => state.user);
  const [aravtDetails, setAravtDetails] = useState<AravtDetailsType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAravtDetails = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const details = await fetchAravtDetails(parseInt(id));
        setAravtDetails(details);
      } catch (err) {
        setError('Failed to load Aravt details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAravtDetails();
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
  const canJoin = !user?.aravts?.some(link => link.aravt.id === (aravtIdNum ?? -1)) && !isJoining;

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <div className="flex items-center gap-4">
        {canJoin && (
          <Button 
            onClick={() => setIsJoining(true)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Join Aravt'}
          </Button>
        )}
      </div>

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
                <AvatarFallback>{aravtDetails.leader?.username?.[0] ?? '?'}</AvatarFallback>
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
                    <AvatarFallback>{member.username[0]}</AvatarFallback>
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
        {/* TODO: вернуть блок навыков, когда API снова начнет возвращать skills */}
        {/* {aravtDetails.skills?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {aravtDetails.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )} */}

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

        {/* Do not show Offers for unregistered 
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
                          <p className="font-semibold">{offer.price} AT</p>
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
        */}
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