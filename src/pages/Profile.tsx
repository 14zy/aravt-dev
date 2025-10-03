import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSelectedAravt } from '@/hooks/useSelectedAravt';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import type { UserAravtLink } from '@/types';
import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Profile = () => {
  const { user, applications, isLoading, error, fetchUserProfile, availableSkills, fetchAvailableSkills, addSkill, removeSkill } = useUserStore();
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [skillLevel, setSkillLevel] = useState<string>('1');
  const [experienceYears, setExperienceYears] = useState<string>('0');
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  const authUser = useAuthStore(s => s.user);
  const { currentAravtId, setCurrentAravtId } = useSelectedAravt();
  const aravtLinks = useMemo(() => (
    (authUser?.aravts ?? []) as UserAravtLink[]
  ), [authUser?.aravts]);
  const aravtOptions = useMemo(() => aravtLinks.map(link => ({
    id: link.aravt.id,
    name: link.aravt.name ?? `Aravt #${link.aravt.id}`,
  })), [aravtLinks]);
  const selectedAravtLink = useMemo(
    () => aravtLinks.find(l => l.aravt.id === currentAravtId),
    [aravtLinks, currentAravtId]
  );

  useEffect(() => {
    if (token) {
      api.link_telegram(token)
    }
  }, [token]);

  useEffect(() => {
    fetchUserProfile();
    fetchAvailableSkills();
  }, [fetchUserProfile, fetchAvailableSkills]);

  const handleAddSkill = async () => {
    if (!selectedSkill) return;
    
    await addSkill(
      parseInt(selectedSkill),
      parseInt(skillLevel),
      parseInt(experienceYears)
    );
    
    setIsAddingSkill(false);
    setSelectedSkill('');
    setSkillLevel('1');
    setExperienceYears('0');
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">My Profile</h2>
      <div className="space-y-2">
        <p><strong>Username:</strong> {user?.username}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Full Name:</strong> {user?.full_name}</p>
        <p><strong>Date of Birth:</strong> {user?.date_of_birth}</p>
        <p><strong>City:</strong> {user?.city}</p>
      </div>

      <div className="mt-4">
        <Button
          onClick={async () => {
            try {
              // await api.startKYC();
              alert("KYC process started successfully.");
            } catch (error) {
              console.error("Failed to start KYC process:", error);
              alert("An error occurred while starting the KYC process.");
            }
          }}
          className=""
        >
          Start KYC Process
        </Button>
      </div>

      {/* Aravt Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>My Aravt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.aravts && user.aravts.length > 0 ? (
            <div className="space-y-3">
              {aravtOptions.length > 1 && (
                <div>
                  <label className="text-sm text-muted-foreground">Select Aravt</label>
                  <Select value={currentAravtId?.toString() ?? ''} onValueChange={(v) => {
                    const id = Number(v)
                    setCurrentAravtId(id)
                  }}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose aravt" />
                    </SelectTrigger>
                    <SelectContent>
                      {aravtOptions.map(opt => (
                        <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="p-4 border rounded-lg">
                <p className="font-medium">🌀 {selectedAravtLink?.aravt.name ?? `Aravt #${selectedAravtLink?.aravt.id}`} (№{selectedAravtLink?.aravt.id})</p>
                <p className="text-sm text-gray-500">{selectedAravtLink?.aravt.is_draft ? 'Draft' : 'Active'}</p>
              </div>

              <Button asChild className="w-full" disabled={!currentAravtId}>
                <Link to={`/dashboard/${currentAravtId || ''}`}>Open Dashboard</Link>
              </Button>
              <Button asChild className="w-full">
                <Link to="https://t.me/share/url?url=https://aravt.io/">Share app</Link>
              </Button>
              {/* <Button variant="outline" asChild className="w-full">
                <Link to="#">Leave Aravt</Link>
              </Button> */}
            </div>
          ) : (
            <p className="text-gray-500">Not a member of any Aravt</p>
          )}
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Skills</CardTitle>
          <Dialog open={isAddingSkill} onOpenChange={setIsAddingSkill}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled size="sm">Add Skill</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Skill</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSkills
                      .filter(skill => !user?.skills?.some(userSkill => userSkill.id === skill.id))
                      .map(skill => (
                        <SelectItem key={skill.id} value={skill.id.toString()}>
                          {skill.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Level (1-10)</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={skillLevel}
                      onChange={(e) => setSkillLevel(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Years of Experience</label>
                    <Input
                      type="number"
                      min="0"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleAddSkill}>Add Skill</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {user?.skills && user.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill) => (
                <div key={skill.id} className="group bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                  <span className="font-medium">{skill.name}</span>
                  <span className="text-gray-500 ml-1">Lvl {skill.level}</span>
                  {skill.experience_years > 0 && (
                    <span className="text-gray-500 ml-1">• {skill.experience_years}y exp</span>
                  )}
                  <button
                    onClick={() => removeSkill(skill.id)}
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-gray-500 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No skills added yet</p>
          )}
        </CardContent>
      </Card>
  
      {<div className="mt-4 pt-4 mb-4">
        <h3 className="text-md font-semibold mb-2">Requests</h3>
        {applications?.length > 0 ? (
          <div className="space-y-2">
            {applications.map((request) => (
              <div key={request.id} className="rounded-md border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {request.aravt_name ?? 'Aravt'} <span className="text-muted-foreground">(№{request.aravt_id})</span>
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground break-words">
                  {request.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
            <p className="text-gray-500">You haven’t submitted any join requests yet.</p>
        )}
      </div>}

      <div>
        <button 
        onClick={async () => {
          await api.logout()
          useAuthStore.getState().logout()
        }}
        className={cn(
          "mt-4 bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-md text-sm font-medium transition duration-200 ease-in-out"
        )}
      >
        Logout
        </button>
      </div>

    </div>
  );
};

export default Profile; 