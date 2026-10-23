export function subscribeSessionNavigation(navigate, target = window) {
  const ended = () => navigate('/login', { replace: true });
  target.addEventListener('bc:session-ended', ended);
  return () => target.removeEventListener('bc:session-ended', ended);
}
