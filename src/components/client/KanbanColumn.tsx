import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '@/types';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: number;
  title: string;
  tasks: Task[];
  className?: string;
}

export const KanbanColumn = ({ id, title, tasks, className }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      column: id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'p-4 bg-muted/50 rounded-lg',
        isOver && 'ring-2 ring-primary',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">{title}</h3>
        <span className="text-sm text-muted-foreground">{tasks.length}</span>
      </div>
      <SortableContext
        items={tasks.map(t => t.id.toString())}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}; 