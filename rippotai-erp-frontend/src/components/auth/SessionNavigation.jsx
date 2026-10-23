import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeSessionNavigation } from '../../lib/session-navigation.js';

export function SessionNavigation() {
  const navigate = useNavigate();
  useEffect(() => subscribeSessionNavigation(navigate), [navigate]);
  return null;
}
