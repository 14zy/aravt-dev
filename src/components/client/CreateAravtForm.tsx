import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import useSelectedAravt from '@/hooks/useSelectedAravt';
import { useAravtsStore } from '@/store/aravts';
import { useAuthStore } from '@/store/auth';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateAravtForm = ({ onClose }: { onClose: () => void }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createAravt = useAravtsStore(state => state.createAravt);
  const fetchAravtDetails = useAravtsStore(state => state.fetchAravtDetails);
  const fetchUser = useAuthStore(state => state.fetchUser);
  const user = useAuthStore(state => state.user);
  const { currentAravtId, currentAravt, setCurrentAravtId } = useSelectedAravt();
  const navigate = useNavigate();

  const parentAravtLabel = useMemo(() => {
    if (!currentAravtId) return 'Not selected';
    const namePart = currentAravt?.name ?? `Aravt #${currentAravtId}`;
    return `${namePart} (№${currentAravtId})`;
  }, [currentAravt?.name, currentAravtId]);

  const leaderName = useMemo(() => {
    if (!user) return '—';
    return user.full_name || user.username;
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAravtId) {
      setErrorMessage('Select a parent Aravt to continue.');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const created = await createAravt({ name, description, aravt_father_id: currentAravtId });
      await Promise.all([
        fetchUser(),
        fetchAravtDetails(created.id, { force: true }),
      ]);
      setCurrentAravtId(created.id);
      console.log('created', created);
      navigate(`/dashboard/${created.id}`, { replace: true });
      setName('');
      setDescription('');
      console.log('navigating to', `/dashboard/${created.id}`);
      onClose();
      console.log('onClose');
    } catch (error) {
      console.error('Failed to create Aravt:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create Aravt');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-6 text-xl font-bold">Create New Aravt</h2>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <div className="mb-4">
          <label className="mb-1 block font-medium">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border bg-gray-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter Aravt name"
            required
          />
        </div>
        <div className="mb-4">
          <label className="mb-1 block font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border bg-gray-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Describe your Aravt"
            rows={3}
            required
          />
        </div>
        <div className="mb-4">
          <label className="mb-1 block font-medium">Leader of Aravt</label>
          <div className="rounded border bg-gray-50 p-2 text-gray-700">{leaderName}</div>
        </div>
        <div className="mb-4 text-sm text-gray-700">
          <span className="font-medium">Parent Aravt:</span> {parentAravtLabel}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !currentAravtId}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateAravtForm;