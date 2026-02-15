import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/api';

/**
 * For Admin: fetches all branches and returns selectedBranchId + setter so they can filter by branch.
 * For Manager/Staff: returns only their branch (no filter dropdown needed); selectedBranchId is their branch.
 */
export function useBranchFilter() {
  const { user } = useAuth();
  const role = user?.role != null ? String(user.role).toLowerCase() : '';
  const isAdmin = role === 'admin';

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(''); // '' = All (admin only)
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setBranches([]);
      setSelectedBranchId(user?.branchId ?? '');
      return;
    }
    let cancelled = false;
    setLoading(true);
    authFetch('/api/branches')
      .then(({ ok, data }) => {
        if (cancelled) return;
        setLoading(false);
        const list = Array.isArray(data?.data) ? data.data : [];
        setBranches(list);
        if (selectedBranchId === '' && list.length > 0) setSelectedBranchId(''); // keep All
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const setBranchId = useCallback((id) => {
    setSelectedBranchId(id ?? '');
  }, []);

  return {
    isAdmin,
    branches,
    selectedBranchId: isAdmin ? selectedBranchId : (user?.branchId ?? ''),
    setSelectedBranchId: isAdmin ? setBranchId : () => {},
    loading,
  };
}
