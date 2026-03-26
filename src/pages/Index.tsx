import { useState, useCallback, useEffect } from 'react';
import LoginPage from '@/components/LoginPage';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import QueuePage from '@/pages/QueuePage';
import ClientsPage from '@/pages/ClientsPage';
import TransactionsPage from '@/pages/TransactionsPage';
import ReportsPage from '@/pages/ReportsPage';
import AccountsPage from '@/pages/AccountsPage';
import CashOperationPage from '@/pages/CashOperationPage';
import TransferPage from '@/pages/TransferPage';
import CreditPage from '@/pages/CreditPage';
import TerminalPage from '@/pages/TerminalPage';
import ProfilePage from '@/pages/ProfilePage';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import {
  Employee, Client, Account, Transaction, QueueItem,
} from '@/lib/store';

export default function Index() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all data from backend after login
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cls, accs, txs, q] = await Promise.all([
        api.clients.list(),
        api.accounts.list(),
        api.transactions.list(),
        api.queue.list(),
      ]);
      setClients(cls);
      setAccounts(accs);
      setTransactions(txs.map((t: Record<string, unknown>) => ({
        id: t.id,
        type: t.type,
        typeLabel: t.type_label,
        amount: t.amount ? Number(t.amount) : undefined,
        fromAccount: t.from_account,
        toAccount: t.to_account,
        clientId: t.client_id,
        clientName: t.client_name,
        employeeId: t.employee_id,
        employeeName: t.employee_name,
        status: t.status,
        createdAt: t.created_at,
        docNumber: t.doc_number,
      })));
      setQueue(q.map((qi: Record<string, unknown>) => ({
        id: qi.id,
        clientId: qi.client_id,
        ticketNumber: qi.ticket_number,
        operation: qi.operation,
        operationType: qi.operation_type,
        status: qi.status,
        createdAt: qi.created_at,
      })));
    } catch (e) {
      console.error('Load error:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (employee) loadData();
  }, [employee, loadData]);

  const handleLogin = useCallback((emp: Employee) => setEmployee(emp), []);
  const handleLogout = useCallback(() => { setEmployee(null); setCurrentPage('dashboard'); }, []);

  const addTransaction = useCallback(async (tx: Transaction) => {
    setTransactions((prev) => [tx, ...prev]);
    try {
      await api.transactions.create(tx);
    } catch (e) {
      console.error('Save tx error:', e);
    }
  }, []);

  const handleSetClients = useCallback((cls: Client[]) => setClients(cls), []);
  const handleSetAccounts = useCallback((accs: Account[]) => setAccounts(accs), []);

  const handleSetQueue = useCallback(async (newQueue: QueueItem[]) => {
    setQueue(newQueue);
    // Find changed item
    const changed = newQueue.find((nq) => {
      const old = queue.find((oq) => oq.id === nq.id);
      return old && old.status !== nq.status;
    });
    if (changed) {
      try { await api.queue.update(changed.id, changed.status); } catch (e) { console.error(e); }
    }
  }, [queue]);

  if (!employee) return <LoginPage onLogin={handleLogin} />;

  if (loading) {
    return (
      <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', boxShadow: 'var(--neon-glow)' }}>
            <Icon name="Loader2" size={28} className="text-green-400 animate-spin" />
          </div>
          <p className="neon-text font-semibold">Загрузка данных...</p>
          <p className="text-xs text-muted-foreground mono mt-1">Подключение к базе данных</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard employee={employee} onNavigate={setCurrentPage} transactions={transactions} clients={clients} accounts={accounts} />;
      case 'queue':
        return <QueuePage queue={queue} setQueue={handleSetQueue} clients={clients} onNavigate={setCurrentPage} onOperation={() => {}} />;
      case 'cash_out':
        return <CashOperationPage type="cash_out" clients={clients} accounts={accounts} setAccounts={handleSetAccounts} onAddTransaction={addTransaction} />;
      case 'cash_in':
        return <CashOperationPage type="cash_in" clients={clients} accounts={accounts} setAccounts={handleSetAccounts} onAddTransaction={addTransaction} />;
      case 'transfer':
        return <TransferPage clients={clients} accounts={accounts} onAddTransaction={addTransaction} />;
      case 'transactions':
        return <TransactionsPage transactions={transactions} />;
      case 'clients':
        return <ClientsPage clients={clients} setClients={handleSetClients} accounts={accounts} setAccounts={handleSetAccounts} />;
      case 'accounts':
        return <AccountsPage accounts={accounts} setAccounts={handleSetAccounts} clients={clients} setClients={handleSetClients} />;
      case 'credit':
        return <CreditPage clients={clients} accounts={accounts} setAccounts={handleSetAccounts} onAddTransaction={addTransaction} />;
      case 'reports':
        return <ReportsPage transactions={transactions} />;
      case 'terminal':
        return <TerminalPage />;
      case 'profile':
        return <ProfilePage employee={employee} onLogout={handleLogout} />;
      default:
        return <Dashboard employee={employee} onNavigate={setCurrentPage} transactions={transactions} clients={clients} accounts={accounts} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage} employee={employee} onLogout={handleLogout}>
      {renderPage()}
    </Layout>
  );
}
