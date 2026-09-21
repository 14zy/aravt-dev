import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useSearchParams } from 'react-router-dom';

const LinkTelegram = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  const linkTelegram = useCallback(async () => {
    try {
      if (!token) {
        setError('No token provided');
        return;
      }

      await api.link_telegram(token);

      navigate('/dashboard');
      // console.log(token);

    } catch {
      setError('Failed to link telegram');
    }
  }, [navigate, token]);

  useEffect(() => {
    linkTelegram();
  }, [linkTelegram]);
  
  return (
    <div>
      {error && <p>{error}</p>}
      <p>Linking Telegram...</p>
    </div>
  );
}

export default LinkTelegram;
