import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Globe, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/auth';
import { useTasksStore } from '@/store/tasks';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { TaskCard } from '@/components/client/TaskCard';
import CreateTaskForm from '@/components/client/CreateTaskForm';


const TasksManagement = () => {
  const { user } = useAuthStore();
  const { 
    localTasks, 
    globalTasks, 
    isLoading, 
    error, 
    fetchTasksData,
    updateTaskIsDone 
  } = useTasksStore();
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filterTasks = (tasks: any[]) => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'completed' && task.is_done) ||
                          (statusFilter === 'open' && !task.is_done);
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  };

  const filteredLocalTasks = useMemo(() => filterTasks(localTasks), [localTasks, searchQuery, statusFilter, priorityFilter]);
  const filteredGlobalTasks = useMemo(() => filterTasks(globalTasks), [globalTasks, searchQuery, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTasksData();
  }, [fetchTasksData]);

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-gray-500">Manage your tasks and track progress</p>
        </div>
        <Button onClick={() => setShowCreateTaskForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>

        {showCreateTaskForm && (
          <CreateTaskForm showCreateTaskForm={showCreateTaskForm} setShowCreateTaskForm={setShowCreateTaskForm} fetchTasksData={fetchTasksData} />
        )}     
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tasks Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="local">
            <TabsList>
              <TabsTrigger value="local" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Local Tasks ({filteredLocalTasks.length})
              </TabsTrigger>
              <TabsTrigger value="global" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Global Tasks ({filteredGlobalTasks.length})
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search tasks..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="local" className="mt-4">
              <div className="grid grid-cols-1 gap-4">
                {filteredLocalTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdate={async (taskId, updates) => {
                      await updateTaskIsDone(taskId, updates.is_done || false);
                      await fetchTasksData();
                    }}
                    isLoading={isLoading}
                  />
                ))}
                {filteredLocalTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No local tasks found
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="global" className="mt-4">
              <div className="grid grid-cols-1 gap-4">
                {filteredGlobalTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdate={async (taskId, updates) => {
                      await updateTaskIsDone(taskId, updates.is_done || false);
                      await fetchTasksData();
                    }}
                    isLoading={isLoading}
                  />
                ))}
                {filteredGlobalTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No global tasks found
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TasksManagement;