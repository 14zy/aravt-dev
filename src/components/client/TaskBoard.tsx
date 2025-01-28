import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Task, TaskSort, TaskColumn, Skill } from '@/types';
import { useTasksStore } from '@/store/tasks';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Calendar, Search, SortAsc, SortDesc, Tag } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import { Badge } from '../ui/badge';
import { useAravtsStore } from '@/store/aravts';
interface TaskBoardProps {
  aravtId?: number;
  projectId?: number;
  showGlobalTasks?: boolean;
}

const TaskBoard = ({ aravtId, projectId, showGlobalTasks = false }: TaskBoardProps) => {
  const { user } = useAuthStore();
  const { 
    localTasks, 
    globalTasks,
    taskColumns,
    updateTaskStatus,
    fetchTasksData,
    fetchTaskColumns,
    filters,
    sort,
    setFilters,
    setSort,
    getFilteredAndSortedTasks
  } = useTasksStore();
  const { aravtDetails } = useAravtsStore();
  const aravt = aravtDetails;
  const [columns, setColumns] = useState<TaskColumn[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [dueDateFrom, setDueDateFrom] = useState<Date>();
  const [dueDateTo, setDueDateTo] = useState<Date>();
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [requiredLevel, setRequiredLevel] = useState<number>(1);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchTasksData();
    // Fetch available skills
    const fetchSkills = async () => {
      try {
        const skills = await api.getSkills();
        setAvailableSkills(skills);
      } catch (error) {
        console.error('Error fetching skills:', error);
      }
    };
    fetchSkills();
  }, [fetchTasksData]);

  useEffect(() => {
    if (aravt) {
      // Fetch task columns for the current context
      const fetchColumns = async () => {
        if (aravtId || projectId) {
          const contextId = aravtId || projectId;
          if (contextId !== undefined) {
            fetchTaskColumns(contextId, !!projectId);
          }
        }
      };
      fetchColumns();
    }
  }, [aravtId, projectId, fetchTaskColumns]);

  useEffect(() => {
    setFilters({
      ...filters,
      search: searchQuery,
      priority: selectedPriority === 'all' ? undefined : selectedPriority as Task['priority'],
      due_date_from: dueDateFrom?.toISOString(),
      due_date_to: dueDateTo?.toISOString(),
      skills: selectedSkills,
      required_level: requiredLevel
    });
  }, [searchQuery, selectedPriority, dueDateFrom, dueDateTo, selectedSkills, requiredLevel]);

  useEffect(() => {
    if (aravt) {
      // Fetch task columns for the current Aravt
      const fetchColumns = async () => {
        try {
          const response = await api.get_task_columns(aravt.id, false);
          setColumns(response);
        } catch (error) {
          console.error('Error fetching task columns:', error);
        }
      };
      fetchColumns();
    }
  }, [aravt]);

  const tasks = useMemo(() => {
    let filteredTasks = showGlobalTasks ? globalTasks : localTasks;
    if (aravtId) {
      filteredTasks = filteredTasks.filter(task => task.aravt_id === aravtId);
    }
    if (projectId) {
      filteredTasks = filteredTasks.filter(task => task.project_id === projectId);
    }
    return getFilteredAndSortedTasks(filteredTasks);
  }, [localTasks, globalTasks, aravtId, projectId, showGlobalTasks, filters, sort]);

  const tasksByColumn = useMemo(() => {
    return taskColumns.reduce((acc, column) => {
      acc[column.id] = tasks.filter(task => task.column.id === column.id);
      return acc;
    }, {} as Record<number, Task[]>);
  }, [tasks, taskColumns]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = parseInt(active.id as string);
    const sourceColumn = active.data.current?.column as number;
    const targetColumn = over.data.current?.column as number;
    
    if (sourceColumn !== targetColumn) {
      // Moving to a different column
      const targetItems = tasksByColumn[targetColumn];
      const overIndex = targetItems.length;
      updateTaskStatus(taskId, targetColumn, overIndex);
    } else {
      // Reordering within the same column
      const items = tasksByColumn[sourceColumn];
      const oldIndex = items.findIndex(task => task.id === taskId);
      const newIndex = items.findIndex(task => task.id === parseInt(over.id as string));
      
      if (oldIndex !== newIndex) {
        updateTaskStatus(taskId, sourceColumn, newIndex);
      }
    }

    setActiveId(null);
  };

  const toggleSortDirection = () => {
    setSort({
      ...sort,
      direction: sort.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleSkillSelect = (skillId: number) => {
    setSelectedSkills(prev => 
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters Section - Stack on mobile */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-4">
          <Select
            value={selectedPriority}
            onValueChange={setSelectedPriority}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <DatePicker
            selected={dueDateFrom}
            onChange={(date: Date | null) => setDueDateFrom(date || undefined)}
            placeholderText="Due date from"
            className="w-full sm:w-[180px] border rounded p-2 bg-background"
          />
          <DatePicker
            selected={dueDateTo}
            onChange={(date: Date | null) => setDueDateTo(date || undefined)}
            placeholderText="Due date to"
            className="w-full sm:w-[180px] border rounded p-2 bg-background"
          />
          <Select
            value={sort.field}
            onValueChange={(value) => setSort({ ...sort, field: value as TaskSort['field'] })}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="order">Order</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="due_date">Due Date</SelectItem>
              <SelectItem value="date_time">Created Date</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortDirection}
            className="w-10 h-10"
          >
            {sort.direction === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Skills Filter */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          <span className="text-sm font-medium">Filter by Skills</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableSkills.map((skill) => (
            <Badge
              key={skill.id}
              variant={selectedSkills.includes(skill.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleSkillSelect(skill.id)}
            >
              {skill.name}
            </Badge>
          ))}
        </div>
        {selectedSkills.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm">Minimum Level:</span>
            <Select
              value={requiredLevel.toString()}
              onValueChange={(value) => setRequiredLevel(parseInt(value))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                  <SelectItem key={level} value={level.toString()}>
                    Level {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Kanban Board - Horizontal scroll on mobile */}
      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <div className="flex gap-4 p-4">
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.name}
              tasks={tasks.filter(task => task.column.id === column.id)}
              className="min-w-[300px]"
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default TaskBoard; 