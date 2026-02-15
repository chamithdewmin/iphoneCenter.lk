# Branch filter in the UI

## How it works

### Admin
- **Dashboard**: Top right has a **Branch** dropdown: "All branches" or a specific branch. Changing it refetches dashboard data (sales, daily summary) for that branch.
- **Warehouse List**: Same **Branch** dropdown. You can filter the list to one branch or view "All branches".
- **Other pages**: To add the same behaviour, use the `<BranchFilter />` component and pass `selectedBranchId` (from `useBranchFilter()`) into your API calls when loading data.

### Manager / Staff
- **No dropdown**: They only have one branch (the one they’re assigned to).
- **"Your branch: …"**: On pages that use `<BranchFilter />`, they see a label like **Your branch: Main Branch** so it’s clear they’re viewing only their branch.
- The backend already restricts all data (sales, stock, warehouses, reports) to that branch.

## Reusing on other pages

1. **Use the hook**  
   `const { isAdmin, selectedBranchId, setSelectedBranchId, branches } = useBranchFilter();`

2. **Show the filter**  
   `<BranchFilter id="unique-id" />` in the page header (same as Dashboard / Warehouse List).

3. **Use branch in API calls**  
   - When loading data, if `selectedBranchId` is set, call the API with `?branchId=...` (e.g. `/api/billing/sales?branchId=2`).
   - If `selectedBranchId` is empty (Admin “All branches”), don’t send `branchId` so the API returns all branches’ data.

4. **Manager/Staff**  
   You don’t need to pass anything: the backend uses their `branch_id` and ignores a passed `branchId` for non-admins.

## Components and hook

- **`BranchFilter`** (`@/components/BranchFilter.jsx`): Renders the dropdown (Admin) or “Your branch: …” (Manager/Staff). Use it in any page header.
- **`useBranchFilter`** (`@/hooks/useBranchFilter.js`): Returns `{ isAdmin, branches, selectedBranchId, setSelectedBranchId }`. Use it when you need to pass `branchId` into API calls or filter lists.

## Example: adding branch filter to a Sales list page

```jsx
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { BranchFilter } from '@/components/BranchFilter';

const SalesListPage = () => {
  const { selectedBranchId } = useBranchFilter();
  const [sales, setSales] = useState([]);

  useEffect(() => {
    const url = selectedBranchId
      ? `/api/billing/sales?branchId=${selectedBranchId}`
      : '/api/billing/sales';
    authFetch(url).then(({ data }) => setSales(data?.data ?? []));
  }, [selectedBranchId]);

  return (
    <div>
      <div className="flex justify-between">
        <h1>Sales</h1>
        <BranchFilter id="sales-branch" />
      </div>
      {/* list sales */}
    </div>
  );
};
```
