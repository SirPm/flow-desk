import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';

export function Topbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  function handleLogout() {
    dispatch(logout());
    navigate('/login', { replace: true });
  }

  return (
    <header className="flex h-14 items-center justify-end gap-4 border-b border-slate-200 bg-white px-6">
      {user && (
        <span className="text-sm text-slate-600">
          {user.name} <span className="text-slate-400">&middot;</span>{' '}
          <span className="font-medium text-slate-800">{user.role}</span>
        </span>
      )}
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Log out
      </button>
    </header>
  );
}
