import { useNavigate } from 'react-router';
import { CallbackHandler } from '@hexadian-corporation/auth-react';

export default function CallbackPage() {
  const navigate = useNavigate();
  return (
    <CallbackHandler
      onSuccess={(returnUrl) => navigate(returnUrl, { replace: true })}
      onError={() => navigate('/', { replace: true })}
    />
  );
}
