import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useProjectsStore } from '@/store/projects';
import { Project, ProjectStatus } from '@/types';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export function CreateProjectDialog({ aravt_id }: { aravt_id: number }) {
  const [open, setOpen] = useState(false);
  const [includeFunding, setIncludeFunding] = useState(false);
  const { createProject } = useProjectsStore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newProject: Omit<Project, 'id'> = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      link: formData.get('link') as string,
      fundings: null,
      logo: formData.get('logo') as string,
      status: 'BusinessStatus.NotPosted' as ProjectStatus,
      location: formData.get('location') as string,
    };

    if (includeFunding) {
      const amount = formData.get('fundingAmount') as string;
      // TODO: add currency to API
      // const currency = formData.get('fundingCurrency') as string;
      
      if (amount) {
        newProject.fundings = amount;
      }
    }

    await createProject(aravt_id, newProject);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Title
            </label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <label htmlFor="description" className="text-sm font-medium">
              Description of your Business or Project
            </label>
            <Textarea id="description" placeholder="Making websites online" name="description" required />
          </div>
          <div>
            <label htmlFor="link" className="text-sm font-medium">
              Project Website
            </label>
            <Input id="link" name="link" type="url" required />
          </div>
          <div>
            <label htmlFor="logo" className="text-sm font-medium">
              Logo URL
            </label>
            <Input id="logo" name="logo" placeholder='https://' type="url" required />
          </div>
          <div>
            <label htmlFor="location" className="text-sm font-medium">
              Location
            </label>
            <Input id="location" name="location" placeholder='Ulaanbaatar, Mongolia' required />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="funding-toggle"
                checked={includeFunding}
                onCheckedChange={setIncludeFunding}
              />
              <Label htmlFor="funding-toggle">Looking for Investments?</Label>
            </div>

            {includeFunding && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="fundingAmount" className="text-sm font-medium">
                    Amount
                  </label>
                  <Input 
                    id="fundingAmount" 
                    name="fundingAmount"  
                    value="10000"
                  />
                </div>
                <div>
                  <label htmlFor="fundingCurrency" className="text-sm font-medium">
                    Currency
                  </label>
                  <Input 
                    id="fundingCurrency" 
                    name="fundingCurrency" 
                    placeholder="USD"
                    disabled
                    value="USD"
                  />
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full">
            Create Project
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 