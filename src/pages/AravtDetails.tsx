import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowLeft } from 'lucide-react';
import { useAravtsStore } from '@/store/aravts';
import { useAuthStore } from '@/store/auth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import JoinRequestForm from '@/components/client/JoinRequestForm';
import { toast } from 'react-toastify';
import { Aravt } from '@/types';

const AravtDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [isJoining, setIsJoining] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchAravtDetails, applyToAravt } = useAravtsStore();
  const user = useAuthStore(state => state.user);
  const [aravtDetails, setAravtDetails] = useState<Aravt | null>(null);
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

  const canJoin = !user?.aravt?.id && !isJoining;

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
                <AvatarFallback>{aravtDetails.leader.username[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{aravtDetails.leader.username}</p>
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
              {aravtDetails.team.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{member.username[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.username}</p>
                    <p className="text-sm text-gray-500">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        {aravtDetails.skills?.length > 0 && (
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
        )}

        {/* Projects */}
        {aravtDetails.projects?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {aravtDetails.projects.map(project => (
                  <Card key={project.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{project.name}</h3>
                          <p className="text-sm text-gray-500">{project.description}</p>
                        </div>
                        <Badge>{project.Status}</Badge>
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