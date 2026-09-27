import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSelectedAravt } from '@/hooks/useSelectedAravt';
import { api } from '@/lib/api';
import { getInitials } from '@/lib/avatarUtils';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import type { UserAravtLink } from '@/types';
import {
  ArrowUpRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  CircleUserRound,
  Globe2,
  LogOut,
  Mail,
  MapPin,
  Plus,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Profile = () => {
  const {
    user,
    applications,
    isLoading,
    error,
    fetchUserProfile,
    availableSkills,
    fetchAvailableSkills,
    addSkill,
    removeSkill,
  } = useUserStore();
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [skillLevel, setSkillLevel] = useState('1');
  const [experienceYears, setExperienceYears] = useState('0');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const token = new URLSearchParams(useLocation().search).get('token');

  const authUser = useAuthStore((state) => state.user);
  const { currentAravtId, setCurrentAravtId } = useSelectedAravt();
  const aravtLinks = useMemo(() => (authUser?.aravts ?? []) as UserAravtLink[], [authUser?.aravts]);
  const aravtOptions = useMemo(() => aravtLinks.map((link) => ({
    id: link.aravt.id,
    name: link.aravt.name ?? `Aravt #${link.aravt.id}`,
  })), [aravtLinks]);
  const selectedAravtLink = useMemo(
    () => aravtLinks.find((link) => link.aravt.id === currentAravtId) ?? aravtLinks[0],
    [aravtLinks, currentAravtId],
  );

  useEffect(() => {
    if (token) void api.link_telegram(token);
  }, [token]);

  useEffect(() => {
    void fetchUserProfile();
    void fetchAvailableSkills();
  }, [fetchUserProfile, fetchAvailableSkills]);

  const handleAddSkill = async () => {
    if (!selectedSkill) return;
    await addSkill(Number(selectedSkill), Number(skillLevel), Number(experienceYears));
    setIsAddingSkill(false);
    setSelectedSkill('');
    setSkillLevel('1');
    setExperienceYears('0');
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!user || !file) return;
    try {
      setIsUploadingAvatar(true);
      await api.uploadUserAvatar(user.id, file);
      await fetchUserProfile({ force: true });
      setAvatarPreview(null);
      fileInput.value = '';
    } catch (uploadError) {
      console.error('Failed to upload avatar:', uploadError);
      alert('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!user) return;
    try {
      setIsUploadingAvatar(true);
      await api.deleteUserAvatar(user.id);
      await fetchUserProfile({ force: true });
      setAvatarPreview(null);
    } catch (deleteError) {
      console.error('Failed to delete avatar:', deleteError);
      alert('Failed to delete avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    useAuthStore.getState().logout();
  };

  if (isLoading && !user) return <LoadingSpinner />;
  if (error && !user) return <Alert variant="destructive" className="rounded-2xl"><AlertDescription>{error}</AlertDescription></Alert>;

  const displayName = user?.full_name || user?.username || 'Your profile';
  const activeAravtId = currentAravtId ?? selectedAravtLink?.aravt.id;

  return (
    <div className="relative space-y-6 overflow-hidden px-0 py-0">
      <div className="pointer-events-none absolute -right-32 -top-32 -z-10 h-80 w-80 rounded-full bg-violet-100/70 blur-3xl" />
      <div className="pointer-events-none absolute left-1/4 top-96 -z-10 h-72 w-72 rounded-full bg-emerald-50 blur-3xl" />

      <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-bl from-violet-100/80 via-transparent to-transparent" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative w-fit shrink-0">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg sm:h-28 sm:w-28">
              {(avatarPreview || user?.avatar_url) && <AvatarImage src={avatarPreview || user?.avatar_url || undefined} alt={displayName} />}
              <AvatarFallback className="bg-violet-100 text-2xl font-bold text-violet-700">{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              aria-label="Change profile photo"
              onClick={() => document.getElementById('avatar-upload')?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-slate-950 p-0 text-white shadow-sm transition-colors hover:border-white hover:bg-violet-600"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
          </div>

          <div className="min-w-0 flex-1">
            <Badge variant="secondary" className="mb-3 rounded-full px-3 py-1 text-xs font-medium"><Sparkles className="mr-1.5 h-3.5 w-3.5 text-violet-600" />My profile</Badge>
            <h1 className="truncate text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{displayName}</h1>
            <p className="mt-2 text-sm text-slate-500">@{user?.username ?? 'member'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {user?.city && <Badge variant="outline" className="rounded-full font-normal"><MapPin className="mr-1 h-3.5 w-3.5" />{user.city}</Badge>}
              <Badge variant="outline" className="rounded-full font-normal"><CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600" />Active member</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:self-start">
            {avatarPreview && <Button onClick={() => void handleAvatarUpload()} disabled={isUploadingAvatar} className="rounded-xl">{isUploadingAvatar ? 'Uploading...' : 'Save photo'}</Button>}
            {(avatarPreview || user?.avatar_url) && (
              <Button variant="outline" onClick={() => avatarPreview ? setAvatarPreview(null) : void handleAvatarDelete()} disabled={isUploadingAvatar} className="rounded-xl">
                {avatarPreview ? 'Cancel' : 'Remove photo'}
              </Button>
            )}
          </div>
          
        </div>

        <div className="relative mt-7 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5 sm:max-w-xl sm:gap-4">
          {[
            { label: 'Skills', value: user?.skills?.length ?? 0, icon: Sparkles },
            { label: 'Aravts', value: aravtLinks.length, icon: Users },
            { label: 'Requests', value: applications?.length ?? 0, icon: ArrowUpRight },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl bg-slate-50 px-3 py-3 sm:px-4">
              <Icon className="mb-2 h-4 w-4 text-violet-600" />
              <p className="truncate text-lg font-bold text-slate-950">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </header>

      {error && <Alert variant="destructive" className="rounded-2xl"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <main className="space-y-6">
          <section aria-labelledby="skills-heading" className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="skills-heading" className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Skills & experience</h2>
                <p className="mt-1 text-sm text-slate-500">The capabilities you bring to your teams.</p>
              </div>
              <Dialog open={isAddingSkill} onOpenChange={setIsAddingSkill}>
                <DialogTrigger asChild><Button size="sm" className="rounded-xl"><Plus className="mr-2 h-4 w-4" />Add skill</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add a new skill</DialogTitle></DialogHeader>
                  <div className="grid gap-5 py-4">
                    <div className="space-y-2">
                      <Label>Skill</Label>
                      <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                        <SelectTrigger><SelectValue placeholder="Select a skill" /></SelectTrigger>
                        <SelectContent>
                          {availableSkills.filter((skill) => !user?.skills?.some((userSkill) => userSkill.id === skill.id)).map((skill) => (
                            <SelectItem key={skill.id} value={skill.id.toString()}>{skill.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2"><Label htmlFor="skill-level">Level (1–10)</Label><Input id="skill-level" type="number" min="1" max="10" value={skillLevel} onChange={(event) => setSkillLevel(event.target.value)} /></div>
                      <div className="space-y-2"><Label htmlFor="experience-years">Years of experience</Label><Input id="experience-years" type="number" min="0" value={experienceYears} onChange={(event) => setExperienceYears(event.target.value)} /></div>
                    </div>
                    <Button onClick={() => void handleAddSkill()} disabled={!selectedSkill}>Add skill</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="p-5">
                {user?.skills?.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {user.skills.map((skill) => (
                      <div key={skill.id} className="group flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition-colors hover:border-violet-200 hover:bg-violet-50/30">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 font-bold text-violet-700">{skill.level}</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-950">{skill.name}</p>
                          <p className="text-xs text-slate-500">Level {skill.level}{skill.experience_years > 0 ? ` · ${skill.experience_years}y experience` : ''}</p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" aria-label={`Remove ${skill.name}`} onClick={() => void removeSkill(skill.id)} className="h-8 w-8 shrink-0 rounded-full p-0 text-slate-400 opacity-100 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100"><X className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
                    <Sparkles className="mx-auto h-6 w-6 text-violet-500" />
                    <p className="mt-3 font-semibold text-slate-900">Show what you can do</p>
                    <p className="mt-1 text-sm text-slate-500">Add skills to help other members find the right collaborator.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="requests-heading" className="space-y-4">
            <div>
              <h2 id="requests-heading" className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Join requests</h2>
              <p className="mt-1 text-sm text-slate-500">Track your applications to other Aravts.</p>
            </div>
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="p-5">
                {applications?.length > 0 ? (
                  <div className="space-y-3">
                    {applications.map((request) => (
                      <div key={request.id} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">{request.aravt_name ?? 'Aravt'}</p>
                          <Badge variant="secondary" className="rounded-full">Aravt #{request.aravt_id}</Badge>
                        </div>
                        <p className="mt-2 break-words text-sm leading-6 text-slate-600">{request.text}</p>
                      </div>
                    ))}
                  </div>
                ) : <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">You haven’t submitted any join requests yet.</div>}
              </CardContent>
            </Card>
          </section>
        </main>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><CircleUserRound className="h-5 w-5 text-violet-600" />Personal details</CardTitle>
              <CardDescription>Your account information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Email', value: user?.email, icon: Mail },
                { label: 'City', value: user?.city, icon: MapPin },
                { label: 'Date of birth', value: user?.date_of_birth, icon: CalendarDays },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon className="h-4 w-4" /></div>
                  <div className="min-w-0"><p className="text-xs text-slate-500">{label}</p><p className="truncate text-sm font-medium text-slate-900">{value || 'Not provided'}</p></div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Users className="h-5 w-5 text-emerald-600" />My Aravts</CardTitle>
              <CardDescription>Your current team and workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aravtLinks.length > 0 && selectedAravtLink ? (
                <>
                  {aravtOptions.length > 1 && (
                    <Select value={activeAravtId?.toString() ?? ''} onValueChange={(value) => setCurrentAravtId(Number(value))}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choose Aravt" /></SelectTrigger>
                      <SelectContent>{aravtOptions.map((option) => <SelectItem key={option.id} value={option.id.toString()}>{option.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                  <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white">
                    <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-violet-500/20 blur-2xl" />
                    <Globe2 className="relative h-6 w-6 text-emerald-300" />
                    <p className="relative mt-4 font-semibold">{selectedAravtLink.aravt.name ?? `Aravt #${selectedAravtLink.aravt.id}`}</p>
                    <div className="relative mt-2 flex items-center gap-2 text-xs text-slate-400">
                      <span>#{selectedAravtLink.aravt.id}</span><span>·</span><span>{selectedAravtLink.aravt.is_draft ? 'Draft' : 'Active'}</span>
                      {selectedAravtLink.is_leader_of_aravt && <><span>·</span><span className="text-amber-300">Leader</span></>}
                    </div>
                  </div>
                  <Button asChild className="w-full rounded-xl"><Link to={`/dashboard/${activeAravtId}`}><span>Open dashboard</span><ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
                </>
              ) : <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">Not a member of any Aravt yet.</p>}
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full rounded-xl text-slate-600" onClick={() => void handleLogout()}><LogOut className="mr-2 h-4 w-4" />Log out</Button>
        </aside>
      </div>
    </div>
  );
};

export default Profile;
