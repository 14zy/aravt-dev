import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getInitials } from '@/lib/avatarUtils';
import { UserShort } from '@/types';

interface RequestCardProps {
  request: {
    id: number;
    aravt_id: number,
    user: UserShort;
    text: string;
    date_time: string;
  };
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  isLoading?: boolean;
}

export const RequestCard = ({ request, onApprove, onReject, isLoading }: RequestCardProps) => (
  <Card className="mb-4">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            {request.user.avatar_url && (
              <AvatarImage src={request.user.avatar_url} alt={request.user.full_name} />
            )}
            <AvatarFallback>
              {getInitials(request.user.full_name || request.user.username)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{request.user.full_name}</div>
            <div className="text-sm text-muted-foreground">{request.user.username}</div>
            <div className="text-sm text-muted-foreground">{request.user.email}</div>
            <div className="text-sm text-muted-foreground">{request.text}</div>
          </div>
        </div>
        <div>
          <div className="text-sm text-right mb-2">
            <span className="text-muted-foreground">Referred by: </span>
            {request.user.refered_by_id}
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => onApprove(request.id)}
              disabled={isLoading}
            >
              Accept
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onReject(request.id)}
              disabled={isLoading}
            >
              Decline
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
); 