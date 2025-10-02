import { Button } from '@/components/ui/button';
import { useAravtsStore } from '@/store/aravts';
import { useAuthStore } from '@/store/auth';
import { useState } from 'react';

const CreateAravtForm = ({ onClose }: { onClose: () => void }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentAravtId] = useState<number>(0);
  const createAravt = useAravtsStore(state => state.createAravt);
  const fetchUser = useAuthStore(state => state.fetchUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAravt({ name, description, aravt_father_id: parentAravtId });
      onClose();
      fetchUser();
      alert('Aravt created successfully');

    } catch (error) {
      console.error('Failed to create Aravt:', error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-6">Create New Aravt</h2>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Name</label>
          <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border rounded w-full p-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="Enter Aravt name"
        required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Description</label>
          <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border rounded w-full p-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="Describe your Aravt"
        rows={3}
        required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Leader of Aravt</label>
          <div className="p-2 bg-gray-50 rounded border text-gray-700">Ruben Babaev</div>
        </div>

        <div className="mb-4">
          <div className="text-gray-700 text-sm">
            <span className="font-medium">Parent Aravt:</span> Aravt Systems (№3)
          </div>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Avatar Logo
          <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" disabled />
          </label>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Status: Draft </label>
          {/* <select className="border rounded w-full p-2 bg-gray-100" disabled>
        <option>Draft</option>
        <option>Published</option>
          </select> */}
          {/* <span className="text-xs text-gray-400">Coming soon</span> */}
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Invite People</label>
          <input type="text" className="border rounded p-2 bg-gray-100 mb-1" placeholder="Invitee 1" disabled />
          <input type="text" className="border rounded  p-2 bg-gray-100 mb-1" placeholder="Invitee 2" disabled />
          <input type="text" className="border rounded p-2 bg-gray-100 mb-1" placeholder="Invitee 3" disabled />
          <input type="text" className="border rounded  p-2 bg-gray-100 mb-1" placeholder="Invitee 4" disabled />
          <input type="text" className="border rounded  p-2 bg-gray-100" placeholder="Invitee 5" disabled />
          <input type="text" className="border rounded  p-2 bg-gray-100" placeholder="Invitee 6" disabled />
          {/* <span className="text-xs text-gray-400">Invites coming soon</span> */}
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Commission
          <input type="number" className="border rounded w-24 p-2 bg-gray-100" value={10} min={0} max={100} disabled /> %</label>
          
        </div>
        
        <div className="mb-4 text-sm text-blue-700 bg-blue-50 p-3 rounded">
          To create Aravt you need to pay <span className="font-bold">100 Aravt tokens</span>
        </div>
        
        
        <div className="mb-4 text-xs text-gray-500">
          To learn more about Aravt creation, see this <a href="#" className="text-blue-600 underline">Article</a> or <a href="#" className="text-blue-600 underline">Video</a>.
        </div>
        
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Create</Button>
        </div>
      </form>
    </div>
  );
};

export default CreateAravtForm; 