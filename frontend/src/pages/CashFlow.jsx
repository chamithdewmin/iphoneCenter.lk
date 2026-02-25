import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Search,
  Download,
  Pencil,
  Trash2,
  Repeat,
  AlertTriangle,
  Eye,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { authFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { getStorageData } from '@/utils/storage';
import { useFinance } from '@/contexts/FinanceContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

const SORT_OPTIONS = [
  { value: 'date-asc', label: 'Date (oldest first)' },
  { value: 'date-desc', label: 'Date (newest first)' },
  { value: 'amount-desc', label: 'Amount (highest first)' },
  { value: 'amount-asc', label: 'Amount (lowest first)' },
];

const PERIOD_PRESETS = [
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'last_3_months', label: 'Last 3 months' },
  { id: 'this_year', label: 'This year' },
];

function getPresetDateRange(presetId) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  let dateFrom = '';
  let dateTo = '';
  if (presetId === 'this_month') {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    dateTo = today;
  } else if (presetId === 'last_month') {
    dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    dateTo = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
  } else if (presetId === 'last_3_months') {
    const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    dateFrom = from.toISOString().slice(0, 10);
    dateTo = today;
  } else if (presetId === 'this_year') {
    dateFrom = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
    dateTo = today;
  }
  return { dateFrom, dateTo };
}

const CashFlow = () => {
  const {
    incomes,
    expenses,
    invoices,
    clients,
    settings,
    addIncome,
    addExpense,
    updateIncome,
    updateExpense,
    deleteIncome,
    deleteExpense,
    updateInvoiceStatus,
    loadData,
  } = useFinance();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';

  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState(''); // '' = Select the branch / All (admin)

  const [filters, setFilters] = useState({
    type: 'all', // all | inflow | outflow | upcoming
    category: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    sort: 'date-desc',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addType, setAddType] = useState('inflow'); // inflow | outflow
  const [editingTx, setEditingTx] = useState(null);
  const [apiSales, setApiSales] = useState([]);
  const [apiSalesLoading, setApiSalesLoading] = useState(false);
  const [branchExpenses, setBranchExpenses] = useState([]); // expenses from Expenses page (have branchId)
  const [profitTarget, setProfitTarget] = useState(''); // optional monthly/yearly target (number as string)
  const [form, setForm] = useState({
    source: '',
    category: '',
    customCategory: '',
    amount: '',
    date: '',
    notes: '',
    isRecurring: false,
    clientId: '',
    // Recurring (inflow)
    isRecurringInflow: false,
    recurringFrequency: 'monthly',
    recurringEndDate: '',
    continueIndefinitely: true,
    recurringNotes: '',
    paymentMethod: 'cash',
  });

  // Fetch billing sales from API (POS/invoice sales), optionally filtered by branch
  const refreshApiSales = useCallback(async (branchId) => {
    setApiSalesLoading(true);
    try {
      const url = branchId
        ? `/api/billing/sales?limit=500&branchId=${encodeURIComponent(branchId)}`
        : '/api/billing/sales?limit=500';
      const res = await authFetch(url);
      const data = res?.data?.data;
      setApiSales(Array.isArray(data) ? data : []);
    } catch {
      setApiSales([]);
    } finally {
      setApiSalesLoading(false);
    }
  }, []);

  // Load branches for branch filter dropdown
  useEffect(() => {
    let cancelled = false;
    setBranchesLoading(true);
    authFetch('/api/branches')
      .then((res) => {
        if (cancelled) return;
        const data = res?.data?.data;
        const list = Array.isArray(data) ? data : [];
        setBranches(list);
        if (!isAdmin && user?.branch_id != null && list.length > 0) {
          setSelectedBranchId(String(user.branch_id));
        }
      })
      .catch(() => {
        if (!cancelled) setBranches([]);
      })
      .finally(() => {
        if (!cancelled) setBranchesLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAdmin, user?.branch_id]);

  useEffect(() => {
    // When "All Branches" or no selection, fetch all sales; otherwise fetch for selected branch
    const branchParam = selectedBranchId && selectedBranchId !== 'all' ? selectedBranchId : undefined;
    refreshApiSales(branchParam);
  }, [selectedBranchId, refreshApiSales]);

  // Load branch expenses (Expenses page data with branchId) for per-branch net profit
  useEffect(() => {
    setBranchExpenses(getStorageData('expenses', []));
    const onFocus = () => setBranchExpenses(getStorageData('expenses', []));
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Build unified transaction list from incomes, expenses, unpaid invoices, and API sales
  const allTransactions = useMemo(() => {
    const txList = [];

    // Billing/POS sales as inflows (amount = paid amount received)
    apiSales.forEach((sale) => {
      const paid = parseFloat(sale.paid_amount) || 0;
      const status = (sale.payment_status || '').toLowerCase() === 'paid' ? 'received' : (sale.payment_status || 'pending').toLowerCase();
      txList.push({
        id: `sale_${sale.id}`,
        type: 'inflow',
        date: sale.created_at,
        source: sale.customer_name || 'Walk-in',
        category: 'Sales',
        amount: paid,
        status,
        notes: sale.notes || sale.invoice_number || '',
        isRecurring: false,
        raw: sale,
        sourceType: 'billing',
      });
    });

    incomes.forEach((i) => {
      txList.push({
        id: i.id,
        type: 'inflow',
        date: i.date,
        source: i.clientName || 'Unknown',
        category: i.serviceType || 'Sales',
        amount: i.amount,
        status: 'received',
        notes: i.notes,
        isRecurring: Boolean(i.isRecurring),
        raw: i,
        sourceType: 'income',
      });
    });

    expenses.forEach((e) => {
      txList.push({
        id: e.id,
        type: 'outflow',
        date: e.date,
        source: e.category,
        category: e.category,
        amount: e.amount,
        status: 'paid',
        notes: e.notes,
        isRecurring: e.isRecurring || false,
        raw: e,
        sourceType: 'expense',
      });
    });

    invoices
      .filter((inv) => inv.status !== 'paid')
      .forEach((inv) => {
        const dueDate = inv.dueDate || inv.createdAt;
        const d = new Date(dueDate);
        const now = new Date();
        const status = d < now ? 'overdue' : 'pending';
        txList.push({
          id: inv.id,
          type: 'outflow',
          date: dueDate,
          source: inv.clientName || 'Unknown',
          category: 'Invoice',
          amount: Number(inv.total) || 0,
          status,
          notes: inv.notes,
          isRecurring: false,
          raw: inv,
          sourceType: 'invoice',
        });
      });

    return txList;
  }, [apiSales, incomes, expenses, invoices]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    let list = [...allTransactions];
    const [sortField, sortDir] = filters.sort.split('-');

    list.sort((a, b) => {
      if (sortField === 'date') {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        return sortDir === 'asc' ? da - db : db - da;
      }
      if (sortField === 'amount') {
        const amtA = a.type === 'inflow' ? a.amount : -a.amount;
        const amtB = b.type === 'inflow' ? b.amount : -b.amount;
        return sortDir === 'asc' ? amtA - amtB : amtB - amtA;
      }
      return 0;
    });
    return list;
  }, [allTransactions, filters.sort]);

  // Next month date range for "upcoming" filter
  const nextMonthRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
    return { start, end };
  }, []);

  // Generate projected recurring transactions for next month (when "upcoming" filter)
  const upcomingRecurringTransactions = useMemo(() => {
    const { start, end } = nextMonthRange;
    const list = [];

    const getOccurrences = (item) => {
      const base = new Date(item.date);
      const freq = item.recurringFrequency || 'monthly';
      const endDate = item.recurringEndDate ? new Date(item.recurringEndDate) : null;
      const occurrences = [];

      if (freq === 'monthly') {
        const day = Math.min(base.getDate(), 28);
        const d = new Date(start.getFullYear(), start.getMonth(), day);
        if (d >= start && d <= end && (!endDate || d <= endDate)) {
          occurrences.push(d.toISOString());
        }
      } else if (freq === 'weekly') {
        let d = new Date(base);
        while (d < start) d.setDate(d.getDate() + 7);
        while (d <= end) {
          if (!endDate || d <= endDate) occurrences.push(d.toISOString());
          d.setDate(d.getDate() + 7);
        }
      } else if (freq === 'yearly') {
        if (base.getMonth() === start.getMonth()) {
          const day = Math.min(base.getDate(), 28);
          const d = new Date(start.getFullYear(), start.getMonth(), day);
          if (d >= start && d <= end && (!endDate || d <= endDate)) {
            occurrences.push(d.toISOString());
          }
        }
      }
      return occurrences;
    };

    incomes
      .filter((i) => i.isRecurring)
      .forEach((i) => {
        getOccurrences(i).forEach((dateStr) => {
          list.push({
            id: `recurring-inc-${i.id}-${dateStr}`,
            type: 'inflow',
            date: dateStr,
            source: i.clientName || 'Unknown',
            category: i.serviceType || 'Sales',
            amount: i.amount,
            status: 'upcoming',
            notes: i.recurringNotes || i.notes,
            isRecurring: true,
            raw: i,
            sourceType: 'income',
            isProjected: true,
          });
        });
      });

    expenses
      .filter((e) => e.isRecurring)
      .forEach((e) => {
        getOccurrences(e).forEach((dateStr) => {
          list.push({
            id: `recurring-exp-${e.id}-${dateStr}`,
            type: 'outflow',
            date: dateStr,
            source: e.category,
            category: e.category,
            amount: e.amount,
            status: 'upcoming',
            notes: e.recurringNotes || e.notes,
            isRecurring: true,
            raw: e,
            sourceType: 'expense',
            isProjected: true,
          });
        });
      });

    return list.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [incomes, expenses, nextMonthRange]);

  // Filter transactions (or use upcoming recurring when filter is "upcoming")
  const filteredTransactions = useMemo(() => {
    if (filters.type === 'upcoming') {
      let list = [...upcomingRecurringTransactions];
      if (filters.category !== 'all') list = list.filter((tx) => tx.category === filters.category);
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter((tx) => {
          const haystack = `${tx.source} ${tx.category} ${tx.notes}`.toLowerCase();
          return haystack.includes(q);
        });
      }
      return list;
    }

    return sortedTransactions.filter((tx) => {
      if (filters.type === 'inflow' && tx.type !== 'inflow') return false;
      if (filters.type === 'outflow' && tx.type !== 'outflow') return false;
      if (filters.category !== 'all' && tx.category !== filters.category) return false;
      if (filters.status !== 'all' && tx.status !== filters.status) return false;

      const d = new Date(tx.date);
      if (filters.dateFrom && d < new Date(filters.dateFrom + 'T00:00:00')) return false;
      if (filters.dateTo && d > new Date(filters.dateTo + 'T23:59:59')) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const haystack = `${tx.source} ${tx.category} ${tx.notes}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    filters.type,
    filters.category,
    filters.status,
    filters.dateFrom,
    filters.dateTo,
    searchQuery,
    sortedTransactions,
    upcomingRecurringTransactions,
  ]);

  // Running balance (only received inflows and paid outflows affect balance)
  const transactionsWithBalance = useMemo(() => {
    const affectsBalance = (tx) =>
      (tx.type === 'inflow' && tx.status === 'received') ||
      (tx.type === 'outflow' && (tx.status === 'paid' || tx.sourceType === 'expense'));

    let balance = 0;
    return filteredTransactions.map((tx) => {
      if (affectsBalance(tx)) {
        balance += tx.type === 'inflow' ? tx.amount : -tx.amount;
      }
      return { ...tx, runningBalance: affectsBalance(tx) ? balance : null };
    });
  }, [filteredTransactions]);

  // Summary totals (for filtered view)
  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'inflow' && tx.status === 'received') totalIn += tx.amount;
      if (tx.type === 'outflow' && (tx.status === 'paid' || tx.sourceType === 'expense')) totalOut += tx.amount;
      if (tx.type === 'outflow' && tx.sourceType === 'invoice' && tx.status !== 'paid') totalOut += 0; // pending doesn't count yet
    });
    const netCashFlow = totalIn - totalOut;

    // Current cash = all received income + API sales paid - all paid expenses (full dataset)
    let currentCash = 0;
    incomes.forEach((i) => (currentCash += i.amount));
    expenses.forEach((e) => (currentCash -= e.amount));
    apiSales.forEach((s) => (currentCash += parseFloat(s.paid_amount) || 0));

    // Per-branch or all-branches: total income (sales), total expenses, net profit (respect date filter)
    const hasBranch = selectedBranchId != null && selectedBranchId !== '';
    const isAllBranches = selectedBranchId === 'all';
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom + 'T00:00:00') : null;
    const dateTo = filters.dateTo ? new Date(filters.dateTo + 'T23:59:59') : null;
    const inDateRange = (d) => {
      if (!dateFrom && !dateTo) return true;
      const t = new Date(d).getTime();
      if (dateFrom && t < dateFrom.getTime()) return false;
      if (dateTo && t > dateTo.getTime()) return false;
      return true;
    };
    const totalIncomeBranch = hasBranch
      ? apiSales
          .filter((sale) => inDateRange(sale.created_at))
          .reduce((s, sale) => s + (parseFloat(sale.paid_amount) || 0), 0)
      : 0;
    const totalExpensesBranch = hasBranch
      ? isAllBranches
        ? branchExpenses.filter((e) => inDateRange(e.date)).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
        : branchExpenses
            .filter((e) => String(e.branchId) === String(selectedBranchId) && inDateRange(e.date))
            .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
      : 0;
    const netProfitBranch = totalIncomeBranch - totalExpensesBranch;

    return {
      totalIn,
      totalOut,
      netCashFlow,
      currentCash,
      totalIncomeBranch,
      totalExpensesBranch,
      netProfitBranch,
      hasBranch,
    };
  }, [filteredTransactions, incomes, expenses, apiSales, selectedBranchId, branchExpenses, filters.dateFrom, filters.dateTo]);

  // Profit at a glance: margin % and one-line insight (uses same totals as summary cards)
  const profitInsight = useMemo(() => {
    const income = summary.hasBranch ? summary.totalIncomeBranch : summary.totalIn;
    const expenses = summary.hasBranch ? summary.totalExpensesBranch : summary.totalOut;
    const profit = summary.hasBranch ? summary.netProfitBranch : summary.netCashFlow;
    const margin = income > 0 ? (profit / income) * 100 : 0;
    let text = '';
    if (profit >= 0 && income > 0) {
      text = `Net profit is ${margin.toFixed(0)}% of income.`;
    } else if (profit < 0 && income > 0) {
      text = `Expenses exceed income by ${settings.currency} ${Math.abs(profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}.`;
    } else if (income === 0 && expenses > 0) {
      text = `No income this period; ${settings.currency} ${expenses.toLocaleString(undefined, { maximumFractionDigits: 0 })} in expenses.`;
    } else if (income === 0 && expenses === 0) {
      text = 'No income or expenses in this period.';
    } else {
      text = `Profit margin: ${margin.toFixed(0)}%.`;
    }
    return { margin, text, profit };
  }, [summary, settings.currency]);

  // Period label and active preset (from current date filters)
  const { periodLabel, activePresetId } = useMemo(() => {
    const from = filters.dateFrom;
    const to = filters.dateTo;
    if (!from && !to) return { periodLabel: 'All time', activePresetId: '' };
    const preset = PERIOD_PRESETS.find((p) => {
      const { dateFrom, dateTo } = getPresetDateRange(p.id);
      return dateFrom === from && dateTo === to;
    });
    if (preset) return { periodLabel: preset.label, activePresetId: preset.id };
    const fromStr = from ? new Date(from + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const toStr = to ? new Date(to + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    return { periodLabel: fromStr && toStr ? `Custom: ${fromStr} – ${toStr}` : fromStr || toStr || 'Custom', activePresetId: 'custom' };
  }, [filters.dateFrom, filters.dateTo]);

  // Previous period (same length, ending day before current period start) for comparison
  const previousPeriodSummary = useMemo(() => {
    const from = filters.dateFrom;
    const to = filters.dateTo;
    if (!from || !to) return null;
    const start = new Date(from + 'T00:00:00').getTime();
    const end = new Date(to + 'T23:59:59').getTime();
    const days = Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1;
    const prevEnd = new Date(start - 24 * 60 * 60 * 1000);
    const prevStart = new Date(prevEnd.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    const prevFrom = prevStart.toISOString().slice(0, 10);
    const prevTo = prevEnd.toISOString().slice(0, 10);
    let totalIn = 0;
    let totalOut = 0;
    const hasBranch = selectedBranchId != null && selectedBranchId !== '';
    const isAllBranches = selectedBranchId === 'all';
    const prevStartT = prevStart.getTime();
    const prevEndT = prevEnd.getTime() + 24 * 60 * 60 * 1000;
    if (hasBranch) {
      apiSales.forEach((sale) => {
        const t = new Date(sale.created_at).getTime();
        if (t >= prevStartT && t < prevEndT) totalIn += parseFloat(sale.paid_amount) || 0;
      });
      const expList = isAllBranches ? branchExpenses : branchExpenses.filter((e) => String(e.branchId) === String(selectedBranchId));
      expList.forEach((e) => {
        const t = new Date(e.date).getTime();
        if (t >= prevStartT && t < prevEndT) totalOut += parseFloat(e.amount) || 0;
      });
    } else {
      sortedTransactions.forEach((tx) => {
        const d = new Date(tx.date).getTime();
        if (d < prevStartT || d > prevEndT) return;
        if (tx.type === 'inflow' && tx.status === 'received') totalIn += tx.amount;
        if (tx.type === 'outflow' && (tx.status === 'paid' || tx.sourceType === 'expense')) totalOut += tx.amount;
      });
    }
    return { totalIn, totalOut, profit: totalIn - totalOut };
  }, [filters.dateFrom, filters.dateTo, selectedBranchId, apiSales, branchExpenses, sortedTransactions]);

  // Branch comparison (when no branch selected, for admins): per-branch income, expenses, profit
  const branchComparisonData = useMemo(() => {
    if (branches.length === 0) return [];
    if (selectedBranchId !== '' && selectedBranchId !== 'all') return []; // single branch selected
    if (selectedBranchId === '' && !isAdmin) return []; // "Select the branch" and not admin: hide table
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom + 'T00:00:00').getTime() : null;
    const dateTo = filters.dateTo ? new Date(filters.dateTo + 'T23:59:59').getTime() + 1 : null;
    const inRange = (t) => (!dateFrom && !dateTo) || (t >= (dateFrom || 0) && t < (dateTo || Infinity));
    const byBranch = new Map();
    branches.forEach((b) => byBranch.set(String(b.id), { branchId: b.id, name: b.name || b.code || `Branch ${b.id}`, income: 0, expenses: 0 }));
    apiSales.forEach((sale) => {
      if (!inRange(new Date(sale.created_at).getTime())) return;
      const bid = sale.branch_id != null ? String(sale.branch_id) : null;
      if (bid && byBranch.has(bid)) {
        const row = byBranch.get(bid);
        row.income += parseFloat(sale.paid_amount) || 0;
      }
    });
    branchExpenses.forEach((e) => {
      if (!inRange(new Date(e.date).getTime())) return;
      const bid = e.branchId != null ? String(e.branchId) : null;
      if (bid && byBranch.has(bid)) {
        const row = byBranch.get(bid);
        row.expenses += parseFloat(e.amount) || 0;
      }
    });
    return Array.from(byBranch.values()).map((r) => ({ ...r, profit: r.income - r.expenses, margin: r.income > 0 ? ((r.income - r.expenses) / r.income) * 100 : 0 }));
  }, [selectedBranchId, isAdmin, branches, apiSales, branchExpenses, filters.dateFrom, filters.dateTo]);

  // Income and expense breakdown by category (branch-aware when a branch is selected; all when "All Branches")
  const incomeByCategory = useMemo(() => {
    const map = new Map();
    const hasBranch = selectedBranchId != null && selectedBranchId !== '';
    if (hasBranch) {
      const total = apiSales.reduce((s, sale) => s + (parseFloat(sale.paid_amount) || 0), 0);
      if (total > 0) map.set('Sales', total);
    } else {
      filteredTransactions.forEach((tx) => {
        if (tx.type !== 'inflow' || tx.status !== 'received') return;
        const cat = tx.category || 'Other';
        map.set(cat, (map.get(cat) || 0) + tx.amount);
      });
    }
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [filteredTransactions, selectedBranchId, apiSales]);

  const expensesByCategory = useMemo(() => {
    const map = new Map();
    const hasBranch = selectedBranchId != null && selectedBranchId !== '';
    const isAllBranches = selectedBranchId === 'all';
    if (hasBranch) {
      const expList = isAllBranches ? branchExpenses : branchExpenses.filter((e) => String(e.branchId) === String(selectedBranchId));
      expList.forEach((e) => {
        const cat = e.category || 'Other';
        map.set(cat, (map.get(cat) || 0) + (parseFloat(e.amount) || 0));
      });
    } else {
      filteredTransactions.forEach((tx) => {
        if (tx.type !== 'outflow' || !(tx.status === 'paid' || tx.sourceType === 'expense')) return;
        const cat = tx.category || 'Other';
        map.set(cat, (map.get(cat) || 0) + tx.amount);
      });
    }
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [filteredTransactions, selectedBranchId, branchExpenses]);

  // Upcoming payments (pending + overdue)
  const upcomingPayments = useMemo(() => {
    return allTransactions.filter(
      (tx) => tx.type === 'outflow' && (tx.status === 'pending' || tx.status === 'overdue')
    );
  }, [allTransactions]);

  const upcomingTotal = useMemo(
    () => upcomingPayments.reduce((s, t) => s + t.amount, 0),
    [upcomingPayments]
  );

  const showAlert =
    upcomingTotal > 0 && summary.currentCash < upcomingTotal;

  // Chart data: monthly Income vs Expenses vs Net Profit (last 7 months)
  // When a branch is selected, use branch-specific apiSales + branchExpenses so expenses show correctly
  const chartData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key,
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        income: 0,
        expenses: 0,
        profit: 0,
        yearMonth: d.getTime(),
      });
    }

    const hasBranch = selectedBranchId != null && selectedBranchId !== '';
    const isAllBranches = selectedBranchId === 'all';

    if (hasBranch) {
      // Branch view or all branches: income from apiSales, expenses from branchExpenses
      const branchExpForChart = isAllBranches
        ? branchExpenses
        : branchExpenses.filter((e) => String(e.branchId) === String(selectedBranchId));
      apiSales.forEach((sale) => {
        const d = new Date(sale.created_at);
        if (Number.isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const row = months.find((m) => m.key === key);
        if (!row) return;
        row.income += parseFloat(sale.paid_amount) || 0;
      });
      branchExpForChart.forEach((e) => {
        const d = new Date(e.date);
        if (Number.isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const row = months.find((m) => m.key === key);
        if (!row) return;
        row.expenses += parseFloat(e.amount) || 0;
      });
    } else {
      // No branch: use full transaction list (inflows + outflows/expenses)
      filteredTransactions.forEach((tx) => {
        const d = new Date(tx.date);
        if (Number.isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const row = months.find((m) => m.key === key);
        if (!row) return;
        if (tx.type === 'inflow' && tx.status === 'received') {
          row.income += tx.amount;
        } else if (tx.type === 'outflow' && (tx.status === 'paid' || tx.sourceType === 'expense')) {
          row.expenses += tx.amount;
        }
      });
    }

    months.forEach((row) => {
      row.profit = row.income - row.expenses;
    });
    return months;
  }, [filteredTransactions, selectedBranchId, apiSales, branchExpenses]);

  const allCategories = useMemo(() => {
    const cats = new Set(['Sales', 'Invoice']);
    incomes.forEach((i) => i.serviceType && cats.add(i.serviceType));
    expenses.forEach((e) => e.category && cats.add(e.category));
    return Array.from(cats).sort();
  }, [incomes, expenses]);

  const openAdd = (type) => {
    setAddType(type);
    setForm({
      source: '',
      category: type === 'inflow' ? 'Sales' : settings.expenseCategories[0] || 'Other',
      customCategory: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'cash',
      notes: '',
      isRecurring: false,
      clientId: '',
      isRecurringInflow: false,
      recurringFrequency: 'monthly',
      recurringEndDate: '',
      continueIndefinitely: true,
      recurringNotes: '',
    });
    setEditingTx(null);
    setIsAddOpen(true);
  };

  const openEdit = (tx) => {
    if (tx.sourceType === 'billing') return; // Billing sales are read-only; view on Invoices page
    setEditingTx(tx);
    setAddType(tx.type);
    if (tx.sourceType === 'income') {
      setForm({
        source: tx.raw.clientName || '',
        category: tx.raw.serviceType || 'Sales',
        amount: String(tx.amount),
        date: tx.date ? tx.date.slice(0, 10) : '',
        paymentMethod: tx.raw.paymentMethod || 'cash',
        notes: tx.raw.notes || '',
        isRecurring: false,
        clientId: tx.raw.clientId || '',
        isRecurringInflow: tx.raw.isRecurring || false,
        recurringFrequency: tx.raw.recurringFrequency || 'monthly',
        recurringEndDate: tx.raw.recurringEndDate ? tx.raw.recurringEndDate.slice(0, 10) : '',
        continueIndefinitely: !tx.raw.recurringEndDate,
        recurringNotes: tx.raw.recurringNotes || '',
      });
    } else if (tx.sourceType === 'expense') {
      const isCustom = !settings.expenseCategories.includes(tx.category);
      setForm({
        source: tx.category,
        category: isCustom ? 'Custom' : tx.category,
        customCategory: isCustom ? tx.category : '',
        amount: String(tx.amount),
        date: tx.date ? tx.date.slice(0, 10) : '',
        paymentMethod: tx.raw.paymentMethod || 'cash',
        notes: tx.raw.notes || '',
        isRecurring: tx.raw.isRecurring || false,
        clientId: '',
        recurringFrequency: tx.raw.recurringFrequency || 'monthly',
        recurringEndDate: tx.raw.recurringEndDate ? tx.raw.recurringEndDate.slice(0, 10) : '',
        continueIndefinitely: !tx.raw.recurringEndDate,
        recurringNotes: tx.raw.recurringNotes || '',
      });
    }
    setIsAddOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast({ title: 'Invalid amount', description: 'Please enter a valid amount.' });
      return;
    }

    const amount = Number(form.amount);
    const date = form.date ? new Date(form.date + 'T12:00:00').toISOString() : new Date().toISOString();

    if (addType === 'inflow') {
      if (editingTx?.sourceType === 'income') {
        updateIncome(editingTx.id, {
          clientName: form.source,
          serviceType: form.category,
          amount,
          date,
          paymentMethod: form.paymentMethod || 'cash',
          notes: form.notes,
          isRecurringInflow: form.isRecurringInflow,
          recurringFrequency: form.recurringFrequency,
          continueIndefinitely: form.continueIndefinitely,
          recurringEndDate: form.recurringEndDate,
          recurringNotes: form.recurringNotes,
        });
        toast({ title: 'Income updated', description: 'Transaction has been updated.' });
      } else {
        addIncome({
          clientId: form.clientId || null,
          clientName: form.source,
          serviceType: form.category,
          amount,
          date,
          paymentMethod: form.paymentMethod || 'cash',
          notes: form.notes,
          isRecurringInflow: form.isRecurringInflow,
          recurringFrequency: form.recurringFrequency,
          continueIndefinitely: form.continueIndefinitely,
          recurringEndDate: form.recurringEndDate,
          recurringNotes: form.recurringNotes,
        });
        toast({ title: 'Income added', description: 'Money in has been recorded.' });
      }
    } else {
      const category =
        form.category === 'Custom' && form.customCategory
          ? form.customCategory
          : form.category;
      if (editingTx?.sourceType === 'expense') {
        updateExpense(editingTx.id, {
          category,
          amount,
          date,
          paymentMethod: form.paymentMethod || 'cash',
          notes: form.notes,
          isRecurring: form.isRecurring,
          recurringFrequency: form.recurringFrequency,
          continueIndefinitely: form.continueIndefinitely,
          recurringEndDate: form.recurringEndDate,
          recurringNotes: form.recurringNotes,
        });
        toast({ title: 'Expense updated', description: 'Transaction has been updated.' });
      } else {
        addExpense({
          category,
          amount,
          date,
          paymentMethod: form.paymentMethod || 'cash',
          notes: form.notes,
          isRecurring: form.isRecurring,
          recurringFrequency: form.recurringFrequency,
          continueIndefinitely: form.continueIndefinitely,
          recurringEndDate: form.recurringEndDate,
          recurringNotes: form.recurringNotes,
        });
        toast({ title: 'Expense added', description: 'Money out has been recorded.' });
      }
    }
    setIsAddOpen(false);
    setEditingTx(null);
  };

  const handleDelete = (tx) => {
    if (tx.sourceType === 'invoice') {
      if (window.confirm('Mark this invoice as paid instead of deleting?')) {
        updateInvoiceStatus(tx.id, 'paid');
        toast({ title: 'Invoice marked paid', description: 'Payment recorded.' });
      }
      return;
    }
    const msg =
      tx.sourceType === 'income'
        ? `Delete income of ${settings.currency} ${tx.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}?`
        : `Delete expense of ${settings.currency} ${tx.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}?`;
    if (window.confirm(msg)) {
      if (tx.sourceType === 'income') deleteIncome(tx.id);
      else deleteExpense(tx.id);
      toast({ title: 'Deleted', description: 'Transaction has been removed.' });
    }
  };

  const handleMarkPaid = (tx) => {
    if (tx.sourceType === 'invoice') {
      updateInvoiceStatus(tx.id, 'paid');
      toast({ title: 'Invoice marked paid', description: 'Payment recorded.' });
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Source', 'Category', 'Amount', 'Status', 'Balance', 'Notes'];
    const rows = transactionsWithBalance.map((t) => [
      t.date,
      t.type,
      t.source,
      t.category,
      t.type === 'inflow' ? `+${t.amount}` : `-${t.amount}`,
      t.status,
      t.runningBalance ?? '',
      (t.notes || '').replace(/[\r\n]+/g, ' '),
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cash-flow.csv';
    a.click();
    toast({ title: 'Export successful', description: 'Cash flow exported to CSV.' });
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const applyPeriodPreset = (presetId) => {
    const { dateFrom, dateTo } = getPresetDateRange(presetId);
    setFilters((p) => ({ ...p, dateFrom, dateTo }));
  };

  const exportProfitSummary = () => {
    const income = summary.hasBranch ? summary.totalIncomeBranch : summary.totalIn;
    const expenses = summary.hasBranch ? summary.totalExpensesBranch : summary.totalOut;
    const profit = summary.hasBranch ? summary.netProfitBranch : summary.netCashFlow;
    const margin = income > 0 ? (profit / income) * 100 : 0;
    const lines = [
      ['Profit Summary', ''],
      ['Period', periodLabel],
      ['Branch', summary.hasBranch ? (selectedBranchId === 'all' ? 'All Branches' : (branches.find((b) => String(b.id) === selectedBranchId)?.name || selectedBranchId)) : 'All'],
      ['Income', income],
      ['Expenses', expenses],
      ['Net Profit', profit],
      ['Profit Margin %', margin.toFixed(1)],
      [''],
      ['Top income categories', ''],
      ...incomeByCategory.slice(0, 5).map(({ name, amount }) => [name, amount]),
      [''],
      ['Top expense categories', ''],
      ...expensesByCategory.slice(0, 5).map(({ name, amount }) => [name, amount]),
    ];
    const csv = lines.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = `profit-summary-${periodLabel.replace(/\s+/g, '-')}.csv`;
    a.click();
    toast({ title: 'Profit summary exported', description: 'Downloaded as CSV.' });
  };

  const currentProfit = summary.hasBranch ? summary.netProfitBranch : summary.netCashFlow;
  const currentIncome = summary.hasBranch ? summary.totalIncomeBranch : summary.totalIn;
  const comparisonText = previousPeriodSummary != null && (currentIncome > 0 || previousPeriodSummary.totalIn > 0 || currentProfit !== 0 || previousPeriodSummary.profit !== 0)
    ? (() => {
        const prev = previousPeriodSummary.profit;
        const diff = currentProfit - prev;
        const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : (currentProfit !== 0 ? 100 : 0);
        if (diff > 0) return { text: `↑ ${settings.currency} ${Math.abs(diff).toLocaleString(undefined, { maximumFractionDigits: 0 })} vs previous period (${pct.toFixed(0)}%)`, positive: true };
        if (diff < 0) return { text: `↓ ${settings.currency} ${Math.abs(diff).toLocaleString(undefined, { maximumFractionDigits: 0 })} vs previous period (${pct.toFixed(0)}%)`, positive: false };
        return { text: 'No change vs previous period', positive: null };
      })()
    : null;
  const targetNum = profitTarget.trim() ? parseFloat(profitTarget) : null;
  const targetStatus = targetNum != null && !Number.isNaN(targetNum) && targetNum > 0
    ? (() => {
        const pct = (currentProfit / targetNum) * 100;
        const over = currentProfit - targetNum;
        if (over >= 0) return { text: `Above target by ${settings.currency} ${over.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, pct, hit: true };
        return { text: `At ${pct.toFixed(0)}% of target (${settings.currency} ${Math.abs(over).toLocaleString(undefined, { maximumFractionDigits: 0 })} to go)`, pct, hit: false };
      })()
    : null;
  const cashAfterUpcoming = summary.currentCash - upcomingTotal;

  return (
    <>
      <Helmet>
        <title>Cash Flow - iphone center.lk</title>
        <meta name="description" content="Track money in, money out, and running cash balance" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Cash Flow</h1>
            <p className="text-muted-foreground">
              When money comes in, when it goes out, and upcoming payments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="cashflow-branch" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Branch
            </label>
            <select
              id="cashflow-branch"
              value={selectedBranchId || ''}
              onChange={(e) => setSelectedBranchId(e.target.value || '')}
              disabled={branchesLoading || (!isAdmin && branches.length <= 1)}
              className="min-w-[180px] px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">Select the branch</option>
              {isAdmin && <option value="all">All Branches</option>}
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || b.code || `Branch ${b.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Period presets + period label */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground mr-1">Period:</span>
          {PERIOD_PRESETS.map((p) => (
            <Button
              key={p.id}
              variant={activePresetId === p.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyPeriodPreset(p.id)}
            >
              {p.label}
            </Button>
          ))}
          <span className="text-sm font-medium text-foreground ml-2 px-2 py-1 rounded bg-muted/50">
            {periodLabel}
          </span>
        </div>

        {/* Net profit hero card removed as requested */}

        {/* Optional profit target */}
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor="profit-target" className="text-sm text-muted-foreground">Profit target ({settings.currency})</Label>
          <Input
            id="profit-target"
            type="number"
            placeholder="e.g. 50000"
            value={profitTarget}
            onChange={(e) => setProfitTarget(e.target.value)}
            className="w-32"
          />
          <Button variant="ghost" size="sm" onClick={exportProfitSummary}>
            <FileSpreadsheet className="w-4 h-4 mr-1" />
            Export profit summary
          </Button>
        </div>

        {/* Summary cards: TOTAL MONEY IN / OUT, NET CASH FLOW, CURRENT CASH */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-5 flex flex-col gap-2"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Money In
            </span>
            <div className="flex items-center justify-between gap-2">
              <p className="text-2xl font-bold text-green-500">
                {settings.currency} {(summary.hasBranch ? summary.totalIncomeBranch : summary.totalIn).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center">
                <ArrowUpCircle className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card rounded-xl border border-border p-5 flex flex-col gap-2"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Money Out
            </span>
            <div className="flex items-center justify-between gap-2">
              <p className="text-2xl font-bold text-red-500">
                {settings.currency} {(summary.hasBranch ? summary.totalExpensesBranch : summary.totalOut).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border p-5 flex flex-col gap-2"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Net Cash Flow
            </span>
            <p className={`text-2xl font-bold ${(summary.hasBranch ? summary.netProfitBranch : summary.netCashFlow) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {settings.currency} {(summary.hasBranch ? summary.netProfitBranch : summary.netCashFlow).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-xl border border-border p-5 flex flex-col gap-2"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Current Cash
            </span>
            <p className={`text-2xl font-bold ${summary.currentCash >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {settings.currency} {summary.currentCash.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </motion.div>
        </div>

        {/* After upcoming payments */}
        {upcomingTotal > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3"
          >
            <p className="text-sm font-medium text-foreground">
              Expected cash after upcoming payments: {settings.currency} {cashAfterUpcoming.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Current cash {settings.currency} {summary.currentCash.toLocaleString(undefined, { maximumFractionDigits: 0 })} − {settings.currency} {upcomingTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} due
            </p>
          </motion.div>
        )}

        {/* Income & expense by category section removed as requested */}

        {/* Branch comparison (when "All Branches" selected, or admins with no selection) */}
        {branchComparisonData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-5 overflow-x-auto"
          >
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Branch comparison</h3>
            {selectedBranchId === 'all' && (
              <p className="text-xs text-muted-foreground mb-3">Net income, net expense, and net profit per branch for the selected period.</p>
            )}
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium">Branch</th>
                  <th className="text-right py-2 font-medium">Income</th>
                  <th className="text-right py-2 font-medium">Expenses</th>
                  <th className="text-right py-2 font-medium">Net profit</th>
                  <th className="text-right py-2 font-medium">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {branchComparisonData.map((row) => (
                  <tr key={row.branchId} className="border-b border-border/50">
                    <td className="py-2 text-foreground">{row.name}</td>
                    <td className="py-2 text-right text-green-500">{settings.currency} {row.income.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="py-2 text-right text-red-500">{settings.currency} {row.expenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className={`py-2 text-right font-medium ${row.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{settings.currency} {row.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="py-2 text-right">{row.margin.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Alert */}
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              You have {settings.currency} {upcomingTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} going out in upcoming payments but only{' '}
              {settings.currency} {summary.currentCash.toLocaleString(undefined, { maximumFractionDigits: 0 })} available.
            </p>
          </motion.div>
        )}

        {/* Monthly chart: Income vs Expenses vs Net Profit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-6 border border-border"
        >
          <h2 className="text-lg font-bold text-white mb-1">Income vs Expenses vs Net Profit</h2>
          <p className="text-sm text-white/90 mb-4">Monthly breakdown — {settings.currency}</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" vertical={false} />
              <XAxis dataKey="month" className="text-xs" tick={{ fill: '#fff', fontSize: 12 }} />
              <YAxis
                className="text-xs"
                tick={{ fill: '#fff', fontSize: 12 }}
                tickFormatter={(v) => `${Number(v) / 1000}K`}
                domain={['auto', 'auto']}
                allowDataOverflow
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  color: '#fff',
                }}
                formatter={(value) => [value?.toLocaleString(undefined, { maximumFractionDigits: 0 }), undefined]}
                labelFormatter={(label) => label}
              />
              <Bar dataKey="income" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" fill="#3b82f6" name="Profit" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Search */}
        <div className="max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by source, category, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            className="px-3 py-2 bg-card border border-secondary rounded-lg text-sm"
            value={filters.type}
            onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
          >
            <option value="all">All (In & Out)</option>
            <option value="inflow">Inflows only</option>
            <option value="outflow">Outflows only</option>
            <option value="upcoming">Upcoming (next month)</option>
          </select>
          <select
            className="px-3 py-2 bg-card border border-secondary rounded-lg text-sm"
            value={filters.category}
            onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
          >
            <option value="all">All categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="px-3 py-2 bg-card border border-secondary rounded-lg text-sm"
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="all">All statuses</option>
            <option value="received">Received</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
          <Input
            type="date"
            className="w-auto px-3 py-2"
            value={filters.dateFrom}
            onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
            placeholder="From"
          />
          <Input
            type="date"
            className="w-auto px-3 py-2"
            value={filters.dateTo}
            onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
            placeholder="To"
          />
          <select
            className="px-3 py-2 bg-card border border-secondary rounded-lg text-sm"
            value={filters.sort}
            onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-secondary overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Source / Recipient</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Balance</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Notes</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactionsWithBalance.map((tx, index) => (
                  <motion.tr
                    key={`${tx.sourceType}-${tx.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className={`border-b border-secondary transition-colors ${
                      (() => {
                        const d = new Date(tx.date);
                        return d >= nextMonthRange.start && d <= nextMonthRange.end
                          ? 'bg-yellow-500/20 hover:bg-yellow-500/30'
                          : 'hover:bg-secondary/50';
                      })()
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {tx.type === 'inflow' ? (
                          <ArrowUpCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        {tx.source}
                        {tx.isRecurring && <Repeat className="w-3 h-3 text-muted-foreground" title="Recurring" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{tx.category}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-right">
                      <span className={tx.type === 'inflow' ? 'text-green-500' : 'text-red-500'}>
                        {tx.type === 'inflow' ? '+' : '-'}
                        {settings.currency} {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          tx.status === 'received' || tx.status === 'paid'
                            ? 'bg-green-500/20 text-green-500'
                            : tx.status === 'overdue'
                            ? 'bg-red-500/20 text-red-500'
                            : tx.status === 'upcoming'
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-yellow-500/20 text-yellow-500'
                        }`}
                      >
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-right">
                      {tx.runningBalance !== null
                        ? `${settings.currency} ${tx.runningBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-[180px] truncate">
                      {tx.notes || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {tx.isProjected ? (
                          <span className="text-xs text-muted-foreground">Projected</span>
                        ) : tx.sourceType === 'invoice' && tx.status !== 'paid' ? (
                          <button
                            type="button"
                            onClick={() => handleMarkPaid(tx)}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors text-green-500"
                            title="Mark as Paid"
                          >
                            <ArrowUpCircle className="w-4 h-4" />
                          </button>
                        ) : tx.sourceType === 'billing' ? (
                          <Link
                            to="/invoices"
                            className="p-2 hover:bg-secondary rounded-lg transition-colors text-primary inline-flex items-center justify-center"
                            title="View invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        ) : tx.sourceType !== 'invoice' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(tx)}
                              className="p-2 hover:bg-secondary rounded-lg transition-colors text-green-500"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(tx)}
                              className="p-2 hover:bg-secondary rounded-lg transition-colors text-red-500"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {transactionsWithBalance.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {filters.type === 'upcoming'
                ? 'No recurring income or expenses scheduled for next month.'
                : 'No transactions found for the selected filters.'}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit transaction dialog */}
      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setEditingTx(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTx ? 'Edit Transaction' : addType === 'inflow' ? 'Add Money In' : 'Add Money Out'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {addType === 'inflow' ? (
              <>
                <div className="space-y-2">
                  <Label>Source / Client</Label>
                  <select
                    className="w-full px-3 py-2 bg-secondary border border-secondary rounded-lg text-sm"
                    value={form.clientId}
                    onChange={(e) => {
                      const c = clients.find((x) => x.id === e.target.value);
                      setForm((p) => ({
                        ...p,
                        clientId: e.target.value,
                        source: c ? c.name : p.source,
                      }));
                    }}
                  >
                    <option value="">Select client or type below</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Or type source name"
                    value={form.source}
                    onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category / Service Type</Label>
                  <Input
                    placeholder="e.g. Sales, Design, Consulting"
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <select
                    className="w-full px-3 py-2 bg-secondary border border-secondary rounded-lg text-sm"
                    value={form.paymentMethod}
                    onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="card">Card</option>
                    <option value="online_transfer">Online Transfer</option>
                    <option value="online_payment">Online Payment</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isRecurringInflow}
                      onChange={(e) => setForm((p) => ({ ...p, isRecurringInflow: e.target.checked }))}
                      className="rounded border-secondary bg-secondary text-primary focus:ring-primary"
                    />
                    Recurring income
                  </Label>
                </div>
                {form.isRecurringInflow && (
                  <div className="space-y-4 pl-4 border-l-2 border-primary/30">
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <select
                        className="w-full px-3 py-2 bg-secondary border border-secondary rounded-lg text-sm"
                        value={form.recurringFrequency}
                        onChange={(e) => setForm((p) => ({ ...p, recurringFrequency: e.target.value }))}
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>End date</Label>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.continueIndefinitely}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                continueIndefinitely: e.target.checked,
                                recurringEndDate: e.target.checked ? '' : p.recurringEndDate,
                              }))
                            }
                            className="rounded border-secondary"
                          />
                          Continue indefinitely
                        </label>
                        {!form.continueIndefinitely && (
                          <Input
                            type="date"
                            value={form.recurringEndDate}
                            onChange={(e) => setForm((p) => ({ ...p, recurringEndDate: e.target.value }))}
                            className="flex-1"
                          />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input
                        placeholder="e.g. Monthly Rent, WiFi Bill, Retainer"
                        value={form.recurringNotes}
                        onChange={(e) => setForm((p) => ({ ...p, recurringNotes: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Recipient / Category</Label>
                  <select
                    className="w-full px-3 py-2 bg-secondary border border-secondary rounded-lg text-sm"
                    value={form.category}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        category: e.target.value,
                        customCategory: e.target.value === 'Custom' ? p.customCategory : '',
                      }))
                    }
                  >
                    {settings.expenseCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="Custom">Custom...</option>
                  </select>
                  {form.category === 'Custom' && (
                    <Input
                      placeholder="Custom category name (e.g. Rent, Salary)"
                      value={form.customCategory}
                      onChange={(e) => setForm((p) => ({ ...p, customCategory: e.target.value }))}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <select
                    className="w-full px-3 py-2 bg-secondary border border-secondary rounded-lg text-sm"
                    value={form.paymentMethod}
                    onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="card">Card</option>
                    <option value="online_payment">Online Payment</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isRecurring}
                      onChange={(e) => setForm((p) => ({ ...p, isRecurring: e.target.checked }))}
                      className="rounded border-secondary bg-secondary text-primary focus:ring-primary"
                    />
                    Recurring (rent, subscriptions)
                  </Label>
                </div>
                {form.isRecurring && (
                  <div className="space-y-4 pl-4 border-l-2 border-primary/30">
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <select
                        className="w-full px-3 py-2 bg-secondary border border-secondary rounded-lg text-sm"
                        value={form.recurringFrequency}
                        onChange={(e) => setForm((p) => ({ ...p, recurringFrequency: e.target.value }))}
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>End date</Label>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.continueIndefinitely}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                continueIndefinitely: e.target.checked,
                                recurringEndDate: e.target.checked ? '' : p.recurringEndDate,
                              }))
                            }
                            className="rounded border-secondary"
                          />
                          Continue indefinitely
                        </label>
                        {!form.continueIndefinitely && (
                          <Input
                            type="date"
                            value={form.recurringEndDate}
                            onChange={(e) => setForm((p) => ({ ...p, recurringEndDate: e.target.value }))}
                            className="flex-1"
                          />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input
                        placeholder="e.g. Monthly Rent, WiFi Bill"
                        value={form.recurringNotes}
                        onChange={(e) => setForm((p) => ({ ...p, recurringNotes: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount ({settings.currency})</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea
                className="w-full px-3 py-2 bg-secondary border border-secondary rounded-lg text-sm min-h-[60px]"
                placeholder="Optional notes"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTx ? 'Update' : 'Add Transaction'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CashFlow;
