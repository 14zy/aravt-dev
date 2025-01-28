import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useUserStore } from '@/store/user';
import { Badge } from "@/components/ui/badge";
import { Project } from "@/types";
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
interface CreateTaskFormProps {
  showCreateTaskForm: boolean;
  setShowCreateTaskForm: (show: boolean) => void;
  fetchTasksData: () => void;
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({showCreateTaskForm, setShowCreateTaskForm, fetchTasksData}) => {
  const { user } = useAuthStore();
  const { all_users, fetchAllUsers } = useUserStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;


  useEffect(() => {
    const fetchProjects = async () => {
      if (user?.aravt) {
        try {
          const aravtData = await api.aravt_aravt(user.aravt.id);
          setProjects(aravtData.projects || []);
        } catch (error) {
          console.error('Error fetching projects:', error);
        }
      }
    };
    fetchProjects();
  }, [user?.aravt]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const filteredUsers = useMemo(() => {
    return all_users.filter(user => 
      user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (user.full_name?.toLowerCase() || '').includes(userSearchQuery.toLowerCase())
    );
  }, [all_users, userSearchQuery]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return filteredUsers.slice(startIndex, startIndex + usersPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

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

      const formValues = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        link: formData.get('link') as string || '',
        reward: Math.floor(Number(formData.get('reward'))),
        reward_type: (formData.get('reward_type') === 'AT' ? 'AT' : 'USDT') as 'AT' | 'USDT',
        definition_of_done: JSON.parse(formData.get('definition_of_done') as string || '{}'),
        is_global: formData.get('is_global') === 'true',
        date_time: formData.get('deadline') as string,
        priority: formData.get('priority') as 'low' | 'medium' | 'high',
        one_time: formData.get('one_time') === 'true',
        project_id: formData.get('project_id') ? Number(formData.get('project_id')) : undefined,
      };

      const taskData = {
        ...formValues,
        responsible_users_ids: selectedUsers,
        is_done: false,
        order: 0,
        completions: {
          completions_amount: 0,
          is_completion_approved: false,
          num_of_approved: 0
        },
        column: {
          id: 1, // Default column ID for backlog
          name: 'Backlog',
          order: 0,
          aravt_id: user?.aravt?.id
        },
        skills: [], // Initialize with empty skills array
        defenition_of_done: formData.get('definition_of_done') ? 
          JSON.parse(formData.get('definition_of_done') as string) : 
          {},
        aravt_id: user?.aravt?.id || 0
      };
      await api.tasks_set_task(taskData);
      await fetchTasksData();
      setShowCreateTaskForm(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  return (
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reward">Reward *</Label>
                <div className="flex gap-2">
                  <Input 
                    id="reward" 
                    name="reward" 
                    type="number" 
                    step="1" 
                    min="0" 
                    required 
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
                <Label htmlFor="is_global">Scope *</Label>
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
                <Label htmlFor="one_time">Frequency *</Label>
                <Select name="one_time" defaultValue="true">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">One Time</SelectItem>
                    <SelectItem value="false">Recurring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-500">Optional Details</h3>
              <div>
                <Label htmlFor="link">Resource Link</Label>
                <Input id="link" name="link" placeholder="https://" />
              </div>
              <div>
                <Label htmlFor="project_id">Project</Label>
                <Select name="project_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project_id">None</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Responsible Users</Label>
                <Select
                  onValueChange={(value) => {
                    const userId = parseInt(value);
                    setSelectedUsers(prev => 
                      prev.includes(userId) 
                        ? prev.filter(id => id !== userId)
                        : [...prev, userId]
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      selectedUsers.length > 0
                        ? `${selectedUsers.length} users selected`
                        : "Select users..."
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search users..."
                        value={userSearchQuery}
                        onChange={(e) => {
                          setUserSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="mb-2"
                      />
                    </div>
                    <div className="max-h-[200px] overflow-auto">
                      {paginatedUsers.map((user) => (
                        <SelectItem 
                          key={user.id} 
                          value={user.id.toString()}
                        >
                          {user.username} ({user.full_name})
                        </SelectItem>
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between p-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedUsers.map((userId) => {
                    const user = all_users.find((u) => u.id === userId);
                    return (
                      user && (
                        <Badge
                          key={userId}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {user.username}
                          <button
                            type="button"
                            className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onClick={() => setSelectedUsers(prev => 
                              prev.filter(id => id !== userId)
                            )}
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove</span>
                          </button>
                        </Badge>
                      )
                    );
                  })}
                </div>
              </div>
              <div>
                <Label htmlFor="definition_of_done">Definition of Done (JSON)</Label>
                <Textarea 
                  id="definition_of_done" 
                  name="definition_of_done" 
                  placeholder="{}"
                  defaultValue="{}"
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

export default CreateTaskForm;