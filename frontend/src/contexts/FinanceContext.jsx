import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { getStorageData, setStorageData } from '@/utils/storage';

const FinanceContext = createContext(null);

export const FinanceProvider = ({ children }) => {
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loans, setLoans] = useState([]);
  const [settings, setSettings] = useState({
    currency: 'Rs',
    expenseCategories: ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Supplies', 'Other'],
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedIncomes = getStorageData('finance_incomes', []);
    const savedExpenses = getStorageData('finance_expenses', []);
    const savedInvoices = getStorageData('finance_invoices', []);
    const savedClients = getStorageData('finance_clients', []);
    const savedSettings = getStorageData('finance_settings', settings);
    const savedAssets = getStorageData('finance_assets', []);
    const savedLoans = getStorageData('finance_loans', []);

    setIncomes(savedIncomes);
    setExpenses(savedExpenses);
    setInvoices(savedInvoices);
    setClients(savedClients);
    setSettings(savedSettings);
    setAssets(savedAssets);
    setLoans(savedLoans);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    setStorageData('finance_incomes', incomes);
  }, [incomes]);

  useEffect(() => {
    setStorageData('finance_expenses', expenses);
  }, [expenses]);

  useEffect(() => {
    setStorageData('finance_invoices', invoices);
  }, [invoices]);

  useEffect(() => {
    setStorageData('finance_clients', clients);
  }, [clients]);

  useEffect(() => {
    setStorageData('finance_settings', settings);
  }, [settings]);

  useEffect(() => {
    setStorageData('finance_assets', assets);
  }, [assets]);

  useEffect(() => {
    setStorageData('finance_loans', loans);
  }, [loans]);

  // Income methods
  const addIncome = useCallback((incomeData) => {
    const newIncome = {
      id: `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...incomeData,
      createdAt: new Date().toISOString(),
      isRecurring: incomeData.isRecurringInflow || false,
    };
    setIncomes((prev) => [...prev, newIncome]);
    return newIncome;
  }, []);

  const updateIncome = useCallback((id, updates) => {
    setIncomes((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
              isRecurring: updates.isRecurringInflow || false,
            }
          : item
      )
    );
  }, []);

  const deleteIncome = useCallback((id) => {
    setIncomes((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Expense methods
  const addExpense = useCallback((expenseData) => {
    const newExpense = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...expenseData,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [...prev, newExpense]);
    return newExpense;
  }, []);

  const updateExpense = useCallback((id, updates) => {
    setExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const deleteExpense = useCallback((id) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Invoice methods
  const addInvoice = useCallback((invoiceData) => {
    const newInvoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...invoiceData,
      createdAt: new Date().toISOString(),
      status: invoiceData.status || 'pending',
    };
    setInvoices((prev) => [...prev, newInvoice]);
    return newInvoice;
  }, []);

  const updateInvoiceStatus = useCallback((id, status) => {
    setInvoices((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  }, []);

  // Client methods
  const addClient = useCallback((clientData) => {
    const newClient = {
      id: `cli_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...clientData,
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [...prev, newClient]);
    return newClient;
  }, []);

  // Settings methods
  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Load data (refresh from localStorage)
  const loadData = useCallback(() => {
    const savedIncomes = getStorageData('finance_incomes', []);
    const savedExpenses = getStorageData('finance_expenses', []);
    const savedInvoices = getStorageData('finance_invoices', []);
    const savedClients = getStorageData('finance_clients', []);
    const savedSettings = getStorageData('finance_settings', settings);
    const savedAssets = getStorageData('finance_assets', []);
    const savedLoans = getStorageData('finance_loans', []);

    setIncomes(savedIncomes);
    setExpenses(savedExpenses);
    setInvoices(savedInvoices);
    setClients(savedClients);
    setSettings(savedSettings);
    setAssets(savedAssets);
    setLoans(savedLoans);
  }, [settings]);

  const totals = useMemo(() => {
    const cashInHand =
      incomes.reduce((sum, i) => sum + (i.amount || 0), 0) -
      expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const bankBalance = 0;
    return {
      cashInHand,
      bankBalance,
    };
  }, [incomes, expenses]);

  return (
    <FinanceContext.Provider
      value={{
        incomes,
        expenses,
        invoices,
        clients,
        assets,
        loans,
        settings,
        addIncome,
        updateIncome,
        deleteIncome,
        addExpense,
        updateExpense,
        deleteExpense,
        addInvoice,
        updateInvoiceStatus,
        addClient,
        updateSettings,
        loadData,
        totals,
        setAssets,
        setLoans,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider');
  }
  return context;
};
