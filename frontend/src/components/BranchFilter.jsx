import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

/**
 * Reusable branch filter for the UI.
 * - Admin: shows dropdown "All branches" / "Branch A" / "Branch B" so they can filter data by branch.
 * - Manager/Staff: shows "Your branch: {name}" (no dropdown; backend already scopes data to their branch).
 *
 * Use on Dashboard, Warehouse List, Sales, Reports, etc.
 * When branch changes (admin only), parent should refetch data (e.g. pass selectedBranchId to API).
 */
export function BranchFilter({ className = '', id = 'branch-filter' }) {
  const { user } = useAuth();
  const { isAdmin, branches, selectedBranchId, setSelectedBranchId } = useBranchFilter();

  if (isAdmin && branches.length > 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Label htmlFor={id} className="text-sm text-muted-foreground whitespace-nowrap">
          Branch
        </Label>
        <select
          id={id}
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[180px]"
        >
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.code})
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (!isAdmin && (user?.branchName || user?.branchCode)) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <MapPin className="w-4 h-4 shrink-0" />
        <span>Your branch: <strong className="text-foreground">{user.branchName || user.branchCode}</strong></span>
      </div>
    );
  }

  return null;
}
