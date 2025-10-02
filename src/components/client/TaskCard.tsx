import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task } from '@/types';
import { Briefcase, CalendarClock, Coins, Globe, Home, Link as LinkIcon } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onUpdate?: (taskId: number, updates: Partial<Task>) => void;
  onDelete?: (taskId: number) => void;
  isLoading?: boolean;
}

export const TaskCard = ({ task, onUpdate, onDelete, isLoading }: TaskCardProps) => (
  <Card className="hover:bg-gray-50 max-w-3xl w-full">
    <CardHeader className="p-4">
      <div className="">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {task.is_global ? (
              <Globe className="h-4 w-4 text-blue-500" />
            ) : (
              <Home className="h-4 w-4 text-green-500" />
            )}
            <CardTitle style={{textAlign:'left'}} className="text-lg">{task.title}</CardTitle>
            {task.priority && (
              <Badge variant={
                task.priority === 'high' ? 'destructive' :
                task.priority === 'medium' ? 'default' :
                'secondary'
              }>
                {task.priority}
              </Badge>
            )}
            {task.business && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {task.business.name}
              </Badge>
            )}
          </div>
          <p style={{textAlign:'left'}} className="pb-2 pt-1 text-gray-500">{task.description}</p>
          {task.business && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Project:</span>
              <a 
                href={task.business.link ?? '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline flex items-center gap-1"
              >
                {task.business.name}
                <LinkIcon className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
        
      </div>
    </CardHeader>
    <CardContent className="p-4 pt-0">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <Coins className="h-4 w-4 mr-1 text-gray-500" />
              <span>{task.reward}</span>
              {/* <span>{task.reward} {task.reward_type}</span> */}
            </div>
            
            <div>
              {task.link && (task.link !== 'No link yet') && (
                <a 
                  href={task.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-500 hover:text-blue-600"
                >
                  <LinkIcon className="h-4 w-4 mr-1" />
                  <span>URL</span>
                </a>
              )}
            </div>

            <div className="flex items-center">
              <CalendarClock className="h-4 w-4 mr-1 text-gray-500" />
              <span>{new Date(task.date_time).toLocaleDateString()}</span>
            </div>

            <div className="flex gap-2">
          {onUpdate && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onUpdate(task.id, { is_done: true })}
              disabled={isLoading || task.is_done === true}
            >
            ◻ Complete
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-500 hover:text-red-600"
              onClick={() => onDelete(task.id)}
              disabled={isLoading}
            >
              Delete
            </Button>
          )}
        </div>

          </div>
        </div>
      </div>

      
    </CardContent>
  </Card>
);
