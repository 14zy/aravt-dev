import { MemberCard } from '@/components/admin/MemberCard';
import { RequestCard } from '@/components/admin/RequestCard';
import { StatsCard } from '@/components/admin/StatsCard';
import { TaskManagementCard } from '@/components/admin/TaskManagementCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useSelectedAravt } from '@/hooks/useSelectedAravt';
import { canManageAravt } from '@/lib/permissions';
import { useAdminStore } from '@/store/admin';
import { useAuthStore } from '@/store/auth';
import { AlertCircle, Globe, Plus, Search, Settings, Users, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Task } from '@/types';

const AdminPanel = () => {
  const { user } = useAuthStore();
  const { 
    stats, 
    members,
    pendingRequests, 
    isLoading, 
    error,
    fetchAravtData,
    fetchAravtApplications,
    approveRequest,
    rejectRequest,
    removeMember,
    tasks,
    createTask,
    updateTask,
    deleteTask,
    settings,
    updateSettings
  } = useAdminStore();

  const { currentAravtId } = useSelectedAravt();
  const canManage = canManageAravt(user, currentAravtId);

  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

  useEffect(() => {
    if (currentAravtId) {
      void fetchAravtData(currentAravtId);
      void fetchAravtApplications(currentAravtId);
    }
  }, [currentAravtId, fetchAravtData, fetchAravtApplications]);


  const [createTaskForm, setCreateTaskForm] = useState<Omit<Task, 'id'>>({
    is_global: false,
    title: '',
    description: '',
    date_time: '',
    reward: 0,
    reward_type: 'AT',
    is_done: false,
    link: '',
    definition_of_done: {},
    responsible_users_ids: [],
    priority: 'low',
    one_time: false,
    completions: {
      completions_amount: 0,
      is_completion_approved: false,
      num_of_approved: 0
    }
  });

  const handleCreateTask = async () => {
    await createTask({
      title: createTaskForm.title,
      description: createTaskForm.description,
      reward: createTaskForm.reward,
      reward_type: createTaskForm.reward_type,
      date_time: createTaskForm.date_time,
      is_global: createTaskForm.is_global,
      is_done: false,
      link: '',
      definition_of_done: {},
      responsible_users_ids: [],
      priority: createTaskForm.priority,
      one_time: createTaskForm.one_time,
      completions: {
        completions_amount: 0,
        is_completion_approved: false,
        num_of_approved: 0
      }
    });
    setIsCreateTaskModalOpen(false);
    setCreateTaskForm({
      is_global: false,
      title: '',
      description: '',
      date_time: '',
      reward: 0,
      reward_type: 'AT',
      is_done: false,
      link: '',
      definition_of_done: {},
      responsible_users_ids: [],
      priority: 'low',
      one_time: false,
      completions: {
        completions_amount: 0,
        is_completion_approved: false,
        num_of_approved: 0
      }
    });
  };

  // TODO: заменить на проверку прав с бэкенда, когда появятся роли пользователя на уровне API
  if (!user || !canManage) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading && !pendingRequests.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage your Aravt community</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Community Size"
          value={stats.totalMembers}
          icon={Users}
          subtitle={`${stats.pendingRequests} pending requests`}
        />
        <StatsCard
          title="Task Management"
          value={stats.activeTasks}
          icon={Globe}
          subtitle={`${stats.taskCompletion}% completion rate`}
        />
        <StatsCard
          title="Total Rewards"
          value={stats.totalRewards}
          icon={Wallet}
          subtitle={`Avg Rating: ${stats.averageRating}`}
        />
        <StatsCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={Users}
          progress={stats.pendingRequests > 0 ? (stats.pendingRequests / 10) * 100 : 0}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="requests" className="space-y-4">
            <TabsList>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="requests">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Join Requests</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </div>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onApprove={approveRequest}
                    onReject={rejectRequest}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="members">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium">Members Management</h2>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search members..." 
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="SuperAdmin">Super Admin</SelectItem>
                        <SelectItem value="AravtLeader">Aravt Leader</SelectItem>
                        <SelectItem value="User">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  {members.map((member) => (
                    <MemberCard
                      key={member.id}
                      canManage={canManage}
                      aravtId={currentAravtId ?? 0}
                      member={member}
                      onRemoveMember={(userId) => { if (!currentAravtId) return; void removeMember(userId, currentAravtId); }}
                      isLoading={isLoading}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasks">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium">Tasks Management</h2>
                  <Button onClick={() => setIsCreateTaskModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search tasks..." 
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="all">
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

                <div className="space-y-4">
                  {tasks.map((task) => (
                    <TaskManagementCard
                      key={task.id}
                      task={task}
                      onUpdate={updateTask}
                      onDelete={deleteTask}
                      isLoading={isLoading}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium">Admin Settings</h2>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Export Settings
                  </Button>
                </div>

                <div className="grid gap-6">
                  {/* Basic Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Settings</CardTitle>
                      <CardDescription>Configure your Aravt's basic information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Aravt Name</Label>
                        <Input 
                          value={settings.name}
                          onChange={(e) => updateSettings({ name: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Description</Label>
                        <Textarea 
                          value={settings.description}
                          onChange={(e) => updateSettings({ description: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Telegram Link</Label>
                        <Input 
                          value={settings.telegramLink}
                          onChange={(e) => updateSettings({ telegramLink: e.target.value })}
                          placeholder="https://t.me/yourgrouplink"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Maximum Members</Label>
                        <Input 
                          type="number"
                          value={settings.maxMembers}
                          onChange={(e) => updateSettings({ maxMembers: parseInt(e.target.value) })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Task Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Task Settings</CardTitle>
                      <CardDescription>Configure task creation and management rules</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Require Task Approval</Label>
                          <p className="text-sm text-muted-foreground">
                            Tasks require admin approval before becoming active
                          </p>
                        </div>
                        <Switch 
                          checked={settings.taskSettings.requireApproval}
                          onCheckedChange={(checked) => 
                            updateSettings({ 
                              taskSettings: { 
                                ...settings.taskSettings, 
                                requireApproval: checked 
                              } 
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label>Minimum Reward</Label>
                          <Input 
                            type="number"
                            value={settings.taskSettings.minReward}
                            onChange={(e) => 
                              updateSettings({ 
                                taskSettings: { 
                                  ...settings.taskSettings, 
                                  minReward: parseInt(e.target.value) 
                                } 
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Maximum Reward</Label>
                          <Input 
                            type="number"
                            value={settings.taskSettings.maxReward}
                            onChange={(e) => 
                              updateSettings({ 
                                taskSettings: { 
                                  ...settings.taskSettings, 
                                  maxReward: parseInt(e.target.value) 
                                } 
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Default Reward Type</Label>
                          <Select 
                            value={settings.taskSettings.defaultRewardType}
                            onValueChange={(value: 'AT' | 'USDT') => 
                              updateSettings({ 
                                taskSettings: { 
                                  ...settings.taskSettings, 
                                  defaultRewardType: value 
                                } 
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AT">Aravt Tokens (AT)</SelectItem>
                              <SelectItem value="USDT">USDT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Member Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Member Settings</CardTitle>
                      <CardDescription>Configure member management rules</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Allow Self Join</Label>
                          <p className="text-sm text-muted-foreground">
                            Members can join without approval
                          </p>
                        </div>
                        <Switch 
                          checked={settings.memberSettings.allowSelfJoin}
                          onCheckedChange={(checked) => 
                            updateSettings({ 
                              memberSettings: { 
                                ...settings.memberSettings, 
                                allowSelfJoin: checked 
                              } 
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Require KYC</Label>
                          <p className="text-sm text-muted-foreground">
                            Members must complete KYC verification
                          </p>
                        </div>
                        <Switch 
                          checked={settings.memberSettings.requireKYC}
                          onCheckedChange={(checked) => 
                            updateSettings({ 
                              memberSettings: { 
                                ...settings.memberSettings, 
                                requireKYC: checked 
                              } 
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Minimum Member Rating</Label>
                        <Input 
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={settings.memberSettings.minRating}
                          onChange={(e) => 
                            updateSettings({ 
                              memberSettings: { 
                                ...settings.memberSettings, 
                                minRating: parseFloat(e.target.value) 
                              } 
                            })
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isCreateTaskModalOpen} onOpenChange={setIsCreateTaskModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Task Type</Label>
              <Select
                value={createTaskForm.is_global ? "true" : "false"}
                onValueChange={(value: string) => 
                  setCreateTaskForm(prev => ({ ...prev, is_global: value === "true" }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Local Task</SelectItem>
                  <SelectItem value="true">Global Task</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input 
                placeholder="Enter task title"
                value={createTaskForm.title}
                onChange={(e) => setCreateTaskForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Enter task description"
                value={createTaskForm.description}
                onChange={(e) => setCreateTaskForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select
                  value={createTaskForm.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setCreateTaskForm(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Deadline</Label>
                <Input 
                  type="date"
                  value={createTaskForm.date_time}
                  onChange={(e) => setCreateTaskForm(prev => ({ ...prev, date_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Reward Amount</Label>
                <Input 
                  type="number" 
                  placeholder="Enter amount"
                  value={createTaskForm.reward}
                  onChange={(e) => setCreateTaskForm(prev => ({ 
                    ...prev, 
                    reward: parseInt(e.target.value) 
                  }))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>One Time Task</Label>
              <Switch
                checked={createTaskForm.one_time}
                onCheckedChange={(checked) => 
                  setCreateTaskForm(prev => ({ ...prev, one_time: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel; 