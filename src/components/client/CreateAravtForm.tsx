import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAravtsStore } from '@/store/aravts';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

const CreateAravtForm = ({ onClose }: { onClose: () => void }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [init_user_id, setInitUserId] = useState<number>(0);
  const createAravt = useAravtsStore(state => state.createAravt);
  const fetchUser = useAuthStore(state => state.fetchUser);
  const { all_users, fetchAllUsers } = useUserStore();

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAravt({ name, description, init_user_id });
      onClose();
      fetchUser();
      alert('Aravt created successfully');
    } catch (error) {
      console.error('Failed to create Aravt:', error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow-md">
        <h2 className="text-lg font-bold mb-4">Create New Aravt</h2>
        <div className="mb-4">
          <Label htmlFor="name">Name</Label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded w-full p-2 bg-gray-100"
            required
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border rounded w-full p-2 bg-gray-100"
            required
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="init_user_id">Initial User</Label>
          <Select
            value={init_user_id.toString()}
            onValueChange={(value) => setInitUserId(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select initial user" />
            </SelectTrigger>
            <SelectContent>
              {all_users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.username} ({user.full_name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="ml-2">Create</Button>
        </div>
      </form>
    </div>
  );
};

export default CreateAravtForm; 