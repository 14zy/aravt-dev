import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/user';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { X } from 'lucide-react';

const Profile = () => {
  const { user, applications, isLoading, error, fetchUserProfile, availableSkills, fetchAvailableSkills, addSkill, removeSkill } = useUserStore();
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [skillLevel, setSkillLevel] = useState<string>('1');
  const [experienceYears, setExperienceYears] = useState<string>('0');
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

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
          {user?.aravt ? (
            <>
              <div className="p-4 border rounded-lg">
                <p className="font-medium">🌀 {user.aravt.name} (№{user.aravt.id})</p>
                <p className="text-sm text-gray-500">{user.aravt.description}</p>
              </div>
              <Button asChild className="w-full">
                <Link to="/dashboard">Open Dashboard</Link>
              </Button>
              <Button asChild className="w-full">
                <Link to="https://t.me/share/url?url=https://aravt.io/">Share app</Link>
              </Button>
              <Button variant="outline"  asChild className="w-full">
                <Link to="#">Leave Aravt</Link>
              </Button>

              
            </>
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
        <h3 className="text-md font-semibold">Requests</h3>
        {applications?.length > 0 ? (
          <ul className="list-disc pl-5">
            {applications.map((request) => (
              <li key={request.id} className="text-gray-700">
                Aravt #{request.aravt_id} - {String(request.text)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No requests to join from other Aravts</p>
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