import JoinRequestForm from '@/components/client/JoinRequestForm';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAravtsStore } from '@/store/aravts';
import { AravtDetails, AravtListItem, Project } from '@/types';
import { Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';

interface AravtCardProps {
  aravt: AravtListItem;
}

const AravtCard = ({ aravt }: AravtCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [detailedAravt, setDetailedAravt] = useState<AravtDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchAravtDetails, applyToAravt } = useAravtsStore();

  const handleExpandClick = async () => {
    if (!isExpanded && !detailedAravt) {
      setIsLoading(true);
      try {
        const details = await fetchAravtDetails(aravt.id);
        setDetailedAravt(details);
      } catch (error) {
        console.error('Failed to load Aravt details:', error);
        toast.error('Failed to load Aravt details');
      } finally {
        setIsLoading(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handleJoinRequestSubmit = async (data: { reason: string }) => {
    setIsSubmitting(true);
    try {
      await applyToAravt(aravt.id, data.reason);
      toast.success('Join request submitted successfully!');
      setIsJoining(false);
    } catch (error) {
      toast.error('Failed to submit join request');
      console.error('Failed to apply to Aravt:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 hover:bg-gray-50 transition-colors">
      {/* Basic Info - Always Visible */}
      <div className="flex items-start gap-6">
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-lg text-left font-semibold">{aravt.id}. {aravt.name}</h3>
              <p className="text-gray-500 text-left ">{aravt.description}</p>
              
              {/* Additional Basic Info */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm">
                
                
                
                {aravt.is_draft !== undefined && (
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 ${aravt.is_draft ? 'text-yellow-600' : 'text-green-600'}`}>
                      {aravt.is_draft ? 'Draft' : 'Active'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Avatar className="h-[100px] w-[100px] rounded-lg">
          <AvatarFallback className="rounded-lg bg-gray-100">
            {aravt.name.substring(0, 2)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Expanded Details */}
      {isExpanded && detailedAravt && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">

            <div>
              <h4 className="font-medium text-left text-sm text-gray-500">Leader</h4>
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>{detailedAravt.leader?.username ?? '?'}</AvatarFallback>
                </Avatar>
                <span>{detailedAravt.leader?.username ?? '—'}</span>
              </div>
            </div>

            
            
            <div>
              <h4 className="font-medium text-sm text-gray-500 text-left">Team Size</h4>
              <div className="flex items-center gap-2 mt-1">
                <Users className="h-4 w-4" />
                <span>{detailedAravt.team.length} members</span>
              </div>
            </div>

            {aravt.responsible_user_id && (
                  <div className="text-left">
                    <span className="text-gray-500">Manager UserID:</span>
                    <span className="ml-2 text-gray-500 font-medium">#{aravt.responsible_user_id}</span>
                  </div>
                )}

          </div>

          {detailedAravt.telegram_chat_link && (
            <div>
              <h4 className="font-medium text-sm text-gray-500">Telegram Chat</h4>
              <a 
                href={detailedAravt.telegram_chat_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Join Telegram Chat
              </a>
            </div>
          )}

          {/* skills removed in new API */}
          {/* {detailedAravt.skills?.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-500">Skills</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                {detailedAravt.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )} */}

          {detailedAravt.business && detailedAravt.business.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-500">Projects</h4>
              <div className="space-y-2 mt-1">
                {detailedAravt.business.map((project: Project) => (
                  <div key={project.id} className="text-sm">
                    {project.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button
          className='bg-blue-700' 
          onClick={() => setIsJoining(!isJoining)}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : '✚ Join Aravt'}
        </Button>
        <Button
          onClick={handleExpandClick}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : isExpanded ? 'X Close' : '▼ More info'}
        </Button>
        
      </div>

      {isJoining && (
        <JoinRequestForm 
          aravtId={aravt.id}
          onSubmit={handleJoinRequestSubmit}
          onClose={() => setIsJoining(false)}
        />
      )}
    </Card>
  );
};

export default AravtCard; 