import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskSkill } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CreditCard, Calendar, Clock, Award, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onUpdate?: (taskId: number, updates: Partial<Task>) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export const TaskCard = ({ task, isDragging, className }: TaskCardProps) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task?.id?.toString() || '',
    data: {
      type: 'Task',
      task,
      column: task?.column?.id ?? null,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  const formatSkillLevel = (level: number) => {
    if (level <= 3) return 'Basic';
    if (level <= 6) return 'Intermediate';
    return 'Advanced';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'p-3 bg-background rounded-lg shadow cursor-grab touch-none',
        (isDragging || isSortableDragging) && 'opacity-50',
        'hover:shadow-md transition-shadow',
        className
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">{task.title}</h3>
        <Badge className={priorityColors[task.priority]}>
          {task.priority}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          <span>{task.reward} {task.reward_type}</span>
        </div>
        {task.date_time && (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(task.date_time).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      {task.responsible_users_ids && task.responsible_users_ids.length > 0 && (
        <div className="mt-2 flex -space-x-2">
          {task.responsible_users_ids.map((userId: number) => (
            <Avatar key={userId} className="h-6 w-6 border-2 border-background">
              <AvatarFallback className="text-xs">
                {userId}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      )}
      <div className="mt-4 space-y-4">
        {/* Due Date */}
        {task.date_time && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Due: {format(new Date(task.date_time), 'MMM d, yyyy')}</span>
          </div>
        )}
        
        {/* Created Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Created: {format(new Date(task.date_time), 'MMM d, yyyy')}</span>
        </div>
        
        {/* Skills */}
        {task.skills?.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="h-4 w-4" />
              <span>Required Skills:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {task.skills.map((skill) => (
                <Badge
                  key={skill.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {skill.name}
                  <span className="text-xs opacity-70">
                    ({formatSkillLevel(skill.level)})
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
