import { TaskCard } from '@/components/client/TaskCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { useAravtsStore } from '@/store/aravts';
import { useAuthStore } from '@/store/auth';
import { useTasksStore } from '@/store/tasks';
import { Project, Task } from '@/types';
import { Globe, Home, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const TasksManagement = () => {
  const { user } = useAuthStore();
  const { currentAravtId, getFirstAravtIdForUser } = useAravtsStore();
  const effectiveAravtId = useMemo(() => getFirstAravtIdForUser(user?.aravts) ?? currentAravtId, [getFirstAravtIdForUser, user?.aravts, currentAravtId]);
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
  const [businesses, setBusinesses] = useState<Project[]>([]);

  useEffect(() => {
    const fetchBusinesses = async () => {
      if (effectiveAravtId) {
        try {
          const aravtData = await api.aravt_aravt(effectiveAravtId);
          setBusinesses(aravtData.business || []);
        } catch (error) {
          console.error('Error fetching businesses:', error);
        }
      }
    };
    fetchBusinesses();
  }, [effectiveAravtId]);

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.currentTarget);
      const responsibleUsers = formData.get('responsible_users_ids') as string;
      
      // Handle both string and array inputs for responsible users
      const responsible_users_ids = responsibleUsers ?
          responsibleUsers.trim().startsWith('[') ?
            JSON.parse(responsibleUsers) :
            responsibleUsers.split(',').map(id => Number(id.trim()))
        : [];

      const taskData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        link: formData.get('link') as string || '',
        reward: Math.floor(Number(formData.get('reward'))),
        reward_type: (formData.get('reward_type') === 'AT' ? 'AT' : 'USDT') as 'AT' | 'USDT',
        definition_of_done: JSON.parse(formData.get('definition_of_done') as string || '{}'),
        responsible_users_ids,
        is_done: false,
        is_global: formData.get('is_global') === 'true',
        date_time: formData.get('deadline') as string,
        priority: formData.get('priority') as 'low' | 'medium' | 'high',
        one_time: formData.get('one_time') === 'true',
        business_id: formData.get('business_id') ? Number(formData.get('business_id')) : undefined,
        completions: {
          completions_amount: 0,
          is_completion_approved: false,
          num_of_approved: 0
        }
      };
      if (!effectiveAravtId) {
        throw new Error('No aravt selected');
      }
      await api.tasks_set_task(effectiveAravtId, taskData);
      await fetchTasksData();
      setShowCreateTaskForm(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const filterTasks = useCallback((tasks: Task[]) => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'completed' && task.is_done) ||
                          (statusFilter === 'open' && !task.is_done);
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [searchQuery, statusFilter, priorityFilter]);

  const filteredLocalTasks = useMemo(() => filterTasks(localTasks), [localTasks, filterTasks]);
  const filteredGlobalTasks = useMemo(() => filterTasks(globalTasks), [globalTasks, filterTasks]);

  useEffect(() => {
    fetchTasksData();
  }, [fetchTasksData]);

  if (!user) {
    return <LoadingSpinner />;
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-0">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-0 space-y-6">
      <div className="">
        <div>
          <h1 className="text-2xl font-bold">Current Tasks</h1>
          <p className="text-gray-500 mb-2">Set objectives and track progress</p>
        </div>
        <Button onClick={() => setShowCreateTaskForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>

        {showCreateTaskForm && (
          <Dialog open={showCreateTaskForm} onOpenChange={setShowCreateTaskForm}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTask}>
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input id="title" name="title" required />
                    </div>
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea id="description" name="description" required />
                    </div>
                  </div>

                  <div>
                      <Label htmlFor="link">URL</Label>
                      <Input id="link" name="link" placeholder="https://" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority *</Label>
                      <Select name="priority" defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="is_global">Local or Global? *</Label>
                      <Select name="is_global" defaultValue="false">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">Local</SelectItem>
                          <SelectItem value="true">Global</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="one_time">One or Many? *</Label>
                      <Select name="one_time" defaultValue="true">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">One Time</SelectItem>
                          <SelectItem value="false">Task for Multiple members</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reward">Reward amount *</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="reward" 
                          name="reward" 
                          type="number" 
                          step="1" 
                          min="0" 
                          required 
                          placeholder='0'
                          className="flex-1"
                        />
                        <div className="w-24">
                          <Select name="reward_type" defaultValue="AT">
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AT">AT</SelectItem>
                              <SelectItem value="USDT">USDT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="deadline">Deadline *</Label>
                      <Input id="deadline" name="deadline" type="datetime-local" required />
                    </div>
                  </div>

                  

                  <div className="space-y-4 pt-2 border-t">
                    {/* <h3 className="text-sm font-medium text-gray-500">Optional</h3> */}
                    
                    <div>
                      <Label htmlFor="business_id">Project</Label>
                      <Select name="business_id">
                        <SelectTrigger>
                          <SelectValue placeholder="Select a business" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="project_id">All</SelectItem>
                          {businesses?.map((business) => (
                            <SelectItem key={business.id} value={business.id.toString()}>
                              {business.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="responsible_users_ids">Responsible Users (IDs)</Label>
                      <Input 
                        id="responsible_users_ids" 
                        name="responsible_users_ids" 
                        placeholder="1, 2, 3" 
                        disabled
                      />
                    </div>
                    <div>
                      {/* <Label htmlFor="definition_of_done">Definition of Done (JSON)</Label> */}
                      <Input 
                        id="definition_of_done" 
                        name="definition_of_done" 
                        placeholder="{}"
                        defaultValue="{}"
                        type="hidden"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setShowCreateTaskForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Task</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}     
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          {/* <CardTitle>Tasks Overview</CardTitle> */}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="local">
            <TabsList>
              <TabsTrigger value="local" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Aravt ({filteredLocalTasks.length})
              </TabsTrigger>
              <TabsTrigger value="global" className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                Global ({filteredGlobalTasks.length})
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