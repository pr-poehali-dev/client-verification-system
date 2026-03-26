import { useState, useCallback } from 'react';
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
import {
  Employee,
  Client,
  Account,
  Transaction,
  QueueItem,
  INITIAL_CLIENTS,
  INITIAL_ACCOUNTS,
  INITIAL_TRANSACTIONS,
  INITIAL_QUEUE,
} from '@/lib/store';

export default function Index() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE);

  const handleLogin = useCallback((emp: Employee) => setEmployee(emp), []);
  const handleLogout = useCallback(() => { setEmployee(null); setCurrentPage('dashboard'); }, []);
  const addTransaction = useCallback((tx: Transaction) => setTransactions((prev) => [tx, ...prev]), []);

  if (!employee) return <LoginPage onLogin={handleLogin} />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard employee={employee} onNavigate={setCurrentPage} transactions={transactions} clients={clients} accounts={accounts} />;
      case 'queue':
        return <QueuePage queue={queue} setQueue={setQueue} clients={clients} onNavigate={setCurrentPage} onOperation={() => {}} />;
      case 'cash_out':
        return <CashOperationPage type="cash_out" clients={clients} accounts={accounts} setAccounts={setAccounts} onAddTransaction={addTransaction} />;
      case 'cash_in':
        return <CashOperationPage type="cash_in" clients={clients} accounts={accounts} setAccounts={setAccounts} onAddTransaction={addTransaction} />;
      case 'transfer':
        return <TransferPage clients={clients} accounts={accounts} onAddTransaction={addTransaction} />;
      case 'transactions':
        return <TransactionsPage transactions={transactions} />;
      case 'clients':
        return <ClientsPage clients={clients} setClients={setClients} accounts={accounts} setAccounts={setAccounts} />;
      case 'accounts':
        return <AccountsPage accounts={accounts} setAccounts={setAccounts} clients={clients} setClients={setClients} />;
      case 'credit':
        return <CreditPage clients={clients} accounts={accounts} setAccounts={setAccounts} onAddTransaction={addTransaction} />;
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
