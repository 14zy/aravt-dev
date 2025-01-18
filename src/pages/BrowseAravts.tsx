import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAravtsStore } from '@/store/aravts';
import { useAuthStore } from '@/store/auth';
import AravtCard from '@/components/client/AravtCard';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Aravt } from '@/types';

const BrowseAravts = () => {
  const { aravts, isLoading, error, fetchAravts } = useAravtsStore();
  const user = useAuthStore(state => state.user);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAravts();
  }, [fetchAravts]);

  const filteredAravts = aravts.filter(aravt => 
    aravt.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    aravt.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    aravt.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading && !aravts.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-8 space-y-8">
      {/* Welcome Message - Only show if user is not in an Aravt */}
      {!user?.aravt?.id && (
        <Card className="bg-blue-50 border-none p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">👋</span>
            <h2 className="text-xl font-semibold">Welcome to Aravt!</h2>
          </div>
          <p className="text-gray-600">You need to join one of the active Aravts to continue.</p>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Aravts Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">🌀 {filteredAravts.length} </h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search Aravts..." 
              className="w-64 pl-9 h-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredAravts.map((aravt) => (
            <AravtCard 
              key={aravt.id} 
              aravt={aravt} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrowseAravts; 