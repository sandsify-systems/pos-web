'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ReportService, DailyReport, SalesReport } from '@/services/report.service';
import { Sale } from '@/types/pos';
import { formatCurrency } from '@/lib/utils';
import { 
  TrendingUp, 
  Wallet, 
  Banknote, 
  CreditCard, 
  FileText, 
  ChevronRight, 
  Loader2,
  Lock,
  Search,
  Calendar,
  Download,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReceiptModal } from '@/components/ReceiptModal';
import { SalesService } from '@/services/sales.service';
import { ExpenseService, Expense } from '@/services/expense.service';
import { toast } from 'react-hot-toast';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

type TabType = 'sales' | 'audit' | 'expenses';

export default function ReportsPage() {
  const { business, user } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<TabType>('sales');
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [reportData, setReportData] = useState<DailyReport | SalesReport | null>(null);
  const [productProfitData, setProductProfitData] = useState<any[]>([]);
  const [monthlyFinancials, setMonthlyFinancials] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'cash' | 'card'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Expense State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ amount: '', category: 'Utilities', description: '', date: new Date().toISOString().split('T')[0] });

  // Audit Log State
  const [activities, setActivities] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditStartDate, setAuditStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [auditEndDate, setAuditEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Receipt Modal State
  const [selectedTransaction, setSelectedTransaction] = useState<Sale | null>(null);
  const [receiptItems, setReceiptItems] = useState<any[]>([]);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const roleKey = user?.role?.toLowerCase() || '';
  const isCashier = roleKey === 'cashier';
  const canViewAudit = !isCashier;

  useEffect(() => {
    if (business && user) {
      if (isCashier) {
        setSelectedPeriod('today');
      }
      if (activeTab === 'sales') {
        fetchData();
      } else if (activeTab === 'audit') {
        fetchActivities();
      } else {
        fetchExpenses();
      }
    }
  }, [selectedPeriod, business, user, isCashier, customDate, activeTab, auditStartDate, auditEndDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let startDateStr = "";
      let endDateStr = "";

      if (isCashier || selectedPeriod === "today") {
        const now = new Date();
        startDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        endDateStr = startDateStr;
      } else if (selectedPeriod === "custom") {
        startDateStr = customDate;
        endDateStr = startDateStr;
      } else if (selectedPeriod === "week" || selectedPeriod === "month") {
        const now = new Date();
        const start = new Date();
        if (selectedPeriod === "week") {
          start.setDate(now.getDate() - 7);
        } else {
          start.setMonth(now.getMonth() - 1);
        }
        startDateStr = start.toISOString().split("T")[0];
        endDateStr = now.toISOString().split("T")[0];
      }

      // Fetch summary statistics
      if (selectedPeriod === "today" || selectedPeriod === "custom" || isCashier) {
        const data = await ReportService.getDailyReport(startDateStr); 
        setReportData(data);
      } else {
        const data = await ReportService.getSalesReport(startDateStr, endDateStr);
        setReportData(data);
      }

      const sales = await ReportService.getSales({
        from: startDateStr,
        to: endDateStr
      });
      setTransactions(sales || []);

      // Fetch product performance if not cashier
      if (!isCashier) {
        const perfData = await ReportService.getProductProfitReport(startDateStr, endDateStr);
        setProductProfitData(perfData || []);

        // Fetch monthly data for the chart (always 6 months for trend)
        const monthlyData = await ReportService.getMonthlyReport(6);
        setMonthlyFinancials(monthlyData || []);
      }

    } catch (e) {
      console.error("Failed to fetch report data", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    setExpenseLoading(true);
    try {
      let startDateStr = "";
      let endDateStr = "";
      
      if (selectedPeriod === "today") {
        const now = new Date();
        startDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        endDateStr = startDateStr;
      } else if (selectedPeriod === "custom") {
        startDateStr = customDate;
        endDateStr = startDateStr;
      } else {
        const now = new Date();
        const start = new Date();
        start.setMonth(now.getMonth() - 1);
        startDateStr = start.toISOString().split("T")[0];
        endDateStr = now.toISOString().split("T")[0];
      }

      const data = await ExpenseService.getExpenses(startDateStr, endDateStr);
      setExpenses(data || []);
    } catch (e) {
      toast.error('Failed to load expenses');
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ExpenseService.createExpense({
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description,
        date: newExpense.date
      });
      toast.success('Expense recorded');
      setIsAddExpenseOpen(false);
      setNewExpense({ amount: '', category: 'Utilities', description: '', date: new Date().toISOString().split('T')[0] });
      fetchExpenses();
      fetchData(); // Refresh summary metrics
    } catch (e) {
      toast.error('Failed to save expense');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await ExpenseService.deleteExpense(id);
      toast.success('Expense deleted');
      fetchExpenses();
      fetchData();
    } catch (e) {
      toast.error('Failed to delete expense');
    }
  };

  const fetchActivities = async () => {
    setAuditLoading(true);
    try {
      const logs = await SalesService.getActivities({
        from: auditStartDate,
        to: auditEndDate
      });
      setActivities(logs || []);
    } catch (e) {
      toast.error('Failed to load audit logs');
      setActivities([]); // Set empty array on error
    } finally {
      setAuditLoading(false);
    }
  };

  const safeTransactions = transactions || [];
  const filteredTransactions = safeTransactions.filter(t => {
    const method = (t.payment_method || t.paymentMethod || '').toLowerCase();
    const matchesFilter = selectedFilter === "all" || method === selectedFilter;
    const tUserId = t.user_id || t.userId;
    const matchesUser = !isCashier || tUserId == user?.id;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      t.id?.toString().includes(query) || 
      method.includes(query) ||
      t.total?.toString().includes(query);

    return matchesFilter && matchesUser && matchesSearch;
  });

  const handleTransactionClick = async (sale: Sale) => {
    try {
       let items: any[] = [];
       let currentSale = sale;
       
       try {
          const fullData = await SalesService.getSaleById(sale.id);
          items = fullData.items || [];
          if (fullData.sale) {
            currentSale = fullData.sale;
          }
       } catch(e) { 
          console.log('Could not fetch full sale details, displaying basic info', e);
       }

       setSelectedTransaction(currentSale);
       setReceiptItems(items);
       setIsReceiptOpen(true);
    } catch (error) {
       toast.error("Could not load receipt");
    }
  };

  const handleGeneratePDF = () => {
     window.print();
  };

  const handleExportCSV = () => {
    if ((filteredTransactions?.length || 0) === 0) {
      toast.error("No transactions to export");
      return;
    }

    const headers = ["ID", "Date", "Payment Method", "Total", "Items Count"];
    const csvData = filteredTransactions.map(t => [
      t.id,
      new Date(t.created_at || t.createdAt || '').toLocaleString(),
      t.payment_method || t.paymentMethod,
      t.total,
      (t as any).items?.length || 0
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500">
            {isCashier ? "Daily sales overview" : "Sales analytics and security auditing"}
          </p>
        </div>
        
        {/* Tab Switcher */}
        {!isCashier && (
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button
               onClick={() => setActiveTab('sales')}
               className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
                 activeTab === 'sales' ? 'bg-white text-teal-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500'
               }`}
            >
              <TrendingUp size={18} />
              Sales
            </button>
            <button
               onClick={() => setActiveTab('audit')}
               className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
                 activeTab === 'audit' ? 'bg-white text-rose-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500'
               }`}
            >
              <ShieldCheck size={18} />
              Audit Log
            </button>
            <button
               onClick={() => setActiveTab('expenses')}
               className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
                 activeTab === 'expenses' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500'
               }`}
            >
              <Wallet size={18} />
              Expenses
            </button>
          </div>
        )}
        
        {/* Period Tabs (Only for Sales tab) */}
        {!isCashier && activeTab === 'sales' && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(['today', 'week', 'month', 'custom'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    selectedPeriod === period
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {period === 'custom' ? 'Specific Date' : period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>

            {selectedPeriod === 'custom' && (
               <div className="relative">
                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                   type="date"
                   value={customDate}
                   onChange={(e) => setCustomDate(e.target.value)}
                   className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 border-teal-500"
                 />
               </div>
            )}
          </div>
        )}
      </div>

      {activeTab === 'audit' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-50 rounded-lg">
                    <ShieldCheck className="text-rose-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">System Activity Log</h3>
                    <p className="text-sm text-slate-500">Real-time track of sensitive business actions</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <Calendar size={14} className="text-slate-400" />
                    <input 
                      type="date" 
                      value={auditStartDate}
                      onChange={(e) => setAuditStartDate(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                    />
                    <span className="text-slate-300">-</span>
                    <input 
                      type="date" 
                      value={auditEndDate}
                      onChange={(e) => setAuditEndDate(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                    />
                  </div>
                  <button 
                    onClick={fetchActivities}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm"
                    title="Refresh Log"
                  >
                    {auditLoading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                  </button>
                </div>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50 border-b border-slate-100">
                     <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 tracking-wider">Timestamp</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 tracking-wider">Action</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 tracking-wider">Staff member</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 tracking-wider">Details</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {auditLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <Loader2 className="animate-spin mx-auto text-rose-600 mb-2" />
                          <p className="text-slate-500">Loading audit trail...</p>
                        </td>
                      </tr>
                    ) : (activities?.length || 0) === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                          No activities found.
                        </td>
                      </tr>
                    ) : (
                      activities.map((log) => {
                        const details = (typeof log.details === 'string' ? JSON.parse(log.details) : log.details) || {};
                        return (
                          <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-slate-900">{new Date(log.created_at).toLocaleDateString()}</p>
                              <p className="text-xs text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                log.action_type === 'completed' 
                                  ? 'bg-green-100 text-green-700' 
                                  : log.action_type === 'voided'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-blue-100 text-blue-700'
                              }`}>
                                {log.action_type === 'completed' && <CheckCircle size={12} />}
                                {log.action_type === 'voided' && <AlertCircle size={12} />}
                                {log.action_type.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 ring-2 ring-white">
                                  {log.user_name?.split(' ').map((n: string) => n[0]).join('')}
                                </div>
                                <span className="text-sm font-medium text-slate-700">{log.user_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-slate-600">
                                {log.action_type === 'completed' && (
                                  <>
                                    Sale #{log.sale_id} finalized for <span className="font-bold text-slate-900">{formatCurrency(details.amount_paid, business?.currency)}</span> via {details.payment_method}
                                  </>
                                )}
                                {log.action_type === 'voided' && (
                                  <>
                                    Voided Sale #{log.sale_id}. <span className="text-rose-600 font-medium">Reason: {details.reason}</span>
                                  </>
                                )}
                                {log.action_type !== 'completed' && log.action_type !== 'voided' && (
                                  <>Action on Sale #{log.sale_id}</>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      ) : activeTab === 'expenses' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-50 rounded-lg">
                 <Wallet className="text-blue-600" size={20} />
               </div>
               <div>
                 <h3 className="font-bold text-slate-900">Business Expenses</h3>
                 <p className="text-sm text-slate-500">Track and manage your operational costs</p>
               </div>
             </div>
             <button 
               onClick={() => setIsAddExpenseOpen(true)}
               className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
             >
               + Record Expense
             </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 tracking-wider">Description</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 tracking-wider text-right">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {expenseLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" />
                        <p className="text-slate-500">Loading expenses...</p>
                      </td>
                    </tr>
                  ) : (expenses?.length || 0) === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No expenses recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-900">{new Date(exp.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                          <span className="px-2 py-1 bg-slate-100 rounded text-xs">{exp.category}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{exp.description}</td>
                        <td className="px-6 py-4 text-sm font-bold text-rose-600 text-right">
                          {formatCurrency(exp.amount, business?.currency)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <AlertCircle size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Expense Modal */}
          {isAddExpenseOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-600 text-white">
                  <h3 className="text-xl font-bold">New Expense</h3>
                  <button onClick={() => setIsAddExpenseOpen(false)} className="text-white/80 hover:text-white">
                    <AlertCircle size={24} className="rotate-45" />
                  </button>
                </div>
                <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Amount</label>
                      <input 
                        type="number" 
                        required
                        value={newExpense.amount}
                        onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                      <input 
                        type="date" 
                        required
                        value={newExpense.date}
                        onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                    <select 
                      value={newExpense.category}
                      onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option>Utilities</option>
                      <option>Rent</option>
                      <option>Salaries</option>
                      <option>Inventory Purchase</option>
                      <option>Repairs</option>
                      <option>Marketing</option>
                      <option>Tax</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                    <textarea 
                      value={newExpense.description}
                      onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                      placeholder="e.g. Paid Electricity Bill"
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-[0.98]"
                  >
                    Save Expense
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Sales Tab Content */}
          {/* New: Bulk Inventory Section for LPG */}
          {(business?.type === "LPG_STATION" || business?.type === "gas_station" || business?.type === "FUEL_STATION") && reportData && (
            <div className="bg-white p-6 rounded-2xl border border-teal-500/20 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 rounded-lg">
                  <TrendingUp size={20} className="text-teal-600" />
                </div>
                <h3 className="font-bold text-slate-900 leading-none">Bulk Stock Performance</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Opening Stock</p>
                  <p className="text-xl font-bold text-slate-900">{(reportData as any).opening_stock?.toFixed(2) || "0.00"} kg</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Purchased (+)</p>
                  <p className="text-xl font-bold text-teal-600">+{(reportData as any).stock_purchased?.toFixed(2) || "0.00"} kg</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Sold (-)</p>
                  <p className="text-xl font-bold text-rose-600">-{(reportData as any).stock_sold?.toFixed(2) || "0.00"} kg</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Closing Stock</p>
                  <p className="text-xl font-bold text-slate-900">{(reportData as any).closing_stock?.toFixed(2) || "0.00"} kg</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                   <div className={`px-4 py-3 rounded-xl flex items-center gap-4 border ${
                      Math.abs((reportData as any).stock_variance || 0) > 0.1 ? 'bg-rose-50 border-rose-100' : 'bg-green-50 border-green-100'
                   }`}>
                      <p className="text-sm font-medium text-slate-600">Daily Stock Variance:</p>
                      <p className={`text-xl font-black ${
                        Math.abs((reportData as any).stock_variance || 0) > 0.1 ? 'text-rose-600' : 'text-green-600'
                      }`}>
                         {((reportData as any).stock_variance || 0).toFixed(2)} kg
                      </p>
                   </div>
                   <p className="text-xs text-slate-400 max-w-[200px]">
                      A positive variance indicates a shortage, while negative indicates a surplus.
                   </p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
             </div>
          ) : (
            <>
              {!isCashier && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Sales */}
                  <button 
                    onClick={() => setSelectedFilter('all')}
                    className={`flex flex-col p-4 bg-white rounded-xl border transition-all text-left ${
                      selectedFilter === 'all' ? 'border-teal-500 ring-1 ring-teal-500 shadow-md shadow-teal-500/5' : 'border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3 text-green-600">
                      <TrendingUp size={20} />
                    </div>
                    <span className="text-slate-500 text-sm font-medium">Total Sales</span>
                    <span className="text-2xl font-bold text-slate-900 mt-1">
                      {formatCurrency(reportData?.total_sales || 0, business?.currency)}
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      {reportData?.total_transactions || 0} transactions
                    </span>
                  </button>

                  <div className="flex flex-col p-4 bg-white rounded-xl border border-slate-200">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-blue-600">
                      <Wallet size={20} />
                    </div>
                    <span className="text-slate-500 text-sm font-medium">Avg. Sale</span>
                    <span className="text-2xl font-bold text-slate-900 mt-1">
                      {formatCurrency(reportData?.average_sale || 0, business?.currency)}
                    </span>
                  </div>

                  <button 
                    onClick={() => setSelectedFilter('cash')}
                    className={`flex flex-col p-4 bg-white rounded-xl border transition-all text-left ${
                      selectedFilter === 'cash' ? 'border-teal-500 ring-1 ring-teal-500 shadow-md shadow-teal-500/5' : 'border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mb-3 text-purple-600">
                      <Banknote size={20} />
                    </div>
                    <span className="text-slate-500 text-sm font-medium">Cash Sales</span>
                    <span className="text-2xl font-bold text-slate-900 mt-1">
                      {formatCurrency(reportData?.cash_sales || 0, business?.currency)}
                    </span>
                  </button>

                  <button 
                    onClick={() => setSelectedFilter('card')}
                    className={`flex flex-col p-4 bg-white rounded-xl border transition-all text-left ${
                      selectedFilter === 'card' ? 'border-teal-500 ring-1 ring-teal-500 shadow-md shadow-teal-500/5' : 'border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-3 text-orange-600">
                      <CreditCard size={20} />
                    </div>
                    <span className="text-slate-500 text-sm font-medium">Card Sales</span>
                    <span className="text-2xl font-bold text-slate-900 mt-1">
                      {formatCurrency(reportData?.card_sales || 0, business?.currency)}
                    </span>
                  </button>

                  <div className="flex flex-col p-4 bg-white rounded-xl border border-slate-200">
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center mb-3 text-teal-600">
                      <TrendingUp size={20} />
                    </div>
                    <span className="text-slate-500 text-sm font-medium">Gross Profit</span>
                    <span className="text-2xl font-bold text-slate-900 mt-1">
                      {formatCurrency(reportData?.total_profit || 0, business?.currency)}
                    </span>
                  </div>

                  <div className="flex flex-col p-4 bg-white rounded-xl border border-slate-200">
                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center mb-3 text-rose-600">
                      <AlertCircle size={20} />
                    </div>
                    <span className="text-slate-500 text-sm font-medium">Expenses</span>
                    <span className="text-2xl font-bold text-slate-900 mt-1">
                      {formatCurrency((reportData as any)?.total_expenses || 0, business?.currency)}
                    </span>
                  </div>

                  <div className="flex flex-col p-4 bg-teal-600 border border-teal-700 rounded-xl relative overflow-hidden group shadow-lg shadow-teal-600/20">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                       <TrendingUp size={48} className="text-white" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3 text-white">
                      <TrendingUp size={20} />
                    </div>
                    <span className="text-white/80 text-sm font-medium">Net Profit</span>
                    <span className="text-2xl font-bold text-white mt-1">
                      {formatCurrency((reportData as any)?.net_profit || 0, business?.currency)}
                    </span>
                    <span className="text-xs text-white/60 mt-1">
                       After subtracting expenses
                    </span>
                  </div>
                </div>
              )}

              {!isCashier && (monthlyFinancials?.length || 0) > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-slate-900">Financial Trends</h3>
                      <p className="text-sm text-slate-500">Revenue vs Profit over the last 6 months</p>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyFinancials}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0D9488" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 12}}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 12}}
                          tickFormatter={(value) => `${value > 1000 ? (value/1000).toFixed(1)+'k' : value}`}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          name="Revenue"
                          stroke="#0D9488" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorRevenue)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="profit" 
                          name="Net Profit"
                          stroke="#10B981" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorProfit)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${isCashier ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
                  <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-900">Recent Transactions</h3>
                      <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                        {filteredTransactions?.length || 0}
                      </span>
                    </div>

                    <div className="relative w-full md:w-64">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input 
                         type="text"
                         placeholder="Search ID, method, amount..."
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500"
                       />
                    </div>
                  </div>
                  
                  <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                    {(filteredTransactions?.length || 0) === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                        No transactions found for this period.
                      </div>
                    ) : (
                      (filteredTransactions || []).map((sale) => (
                        <div 
                          key={sale.id} 
                          className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group flex items-center justify-between"
                          onClick={() => handleTransactionClick(sale)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              sale.status === 'VOIDED' ? 'bg-slate-100 text-slate-400' :
                              (sale.payment_method || sale.paymentMethod)?.toLowerCase() === 'cash' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                              {(sale.payment_method || sale.paymentMethod)?.toLowerCase() === 'cash' ? <Banknote size={18} /> : <CreditCard size={18} />}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${sale.status === 'VOIDED' ? 'text-slate-400 line-through decoration-slate-400' : 'text-slate-900'}`}>
                                Order #{sale.id.toString().slice(-6)}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-slate-500">
                                  {new Date(sale.created_at || sale.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {(sale.payment_method || sale.paymentMethod)?.toUpperCase()}
                                </p>
                                {sale.status === 'VOIDED' && (
                                  <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded">VOIDED</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`font-bold ${sale.status === 'VOIDED' ? 'text-slate-400 line-through decoration-slate-400' : 'text-slate-900'}`}>
                              {formatCurrency(sale.total, business?.currency)}
                            </span>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {!isCashier && (productProfitData?.length || 0) > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mt-6">
                      <div className="p-4 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900">Product Performance</h3>
                        <p className="text-xs text-slate-500">Top products by profitability</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-100 uppercase text-slate-500 font-semibold">
                            <tr>
                              <th className="px-4 py-3">Product</th>
                              <th className="px-4 py-3 text-center">Qty</th>
                              <th className="px-4 py-3 text-right">Revenue</th>
                              <th className="px-4 py-3 text-right">Profit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(productProfitData || []).slice(0, 8).map((item) => (
                              <tr key={item.product_id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-900">{item.product_name}</td>
                                <td className="px-4 py-3 text-center text-slate-600">{item.total_qty}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.revenue, business?.currency)}</td>
                                <td className="px-4 py-3 text-right font-bold text-teal-600">{formatCurrency(item.profit, business?.currency)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {!isCashier && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg shadow-teal-500/20">
                      <h3 className="font-bold text-lg mb-2">Export Data</h3>
                      <p className="text-teal-100 text-sm mb-4">
                        Download comprehensive PDF or CSV reports for this period.
                      </p>
                      <div className="space-y-2">
                        <button 
                          onClick={handleGeneratePDF}
                          className="w-full py-2 bg-white text-teal-700 font-bold rounded-lg hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <FileText size={18} />
                          Generate PDF
                        </button>
                        <button 
                          onClick={handleExportCSV}
                          className="w-full py-2 bg-teal-400/20 text-white border border-teal-400/30 font-bold rounded-lg hover:bg-teal-400/30 transition-colors flex items-center justify-center gap-2"
                        >
                          <Download size={18} />
                          Export CSV
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <h3 className="font-bold text-slate-900 mb-4">Financial Breakdown</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50">
                          <span className="text-slate-500 text-sm">Cost of Goods</span>
                          <span className="font-mono font-medium text-slate-900">
                            {formatCurrency(reportData?.total_cost || 0, business?.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50">
                          <span className="text-slate-500 text-sm">Transfer Sales</span>
                          <span className="font-mono font-medium text-slate-900">
                            {formatCurrency(reportData?.transfer_sales || 0, business?.currency)}
                          </span>
                        </div>
                        {'mobile_money_sales' in (reportData || {}) && (
                          <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50">
                            <span className="text-slate-500 text-sm">Mobile Money</span>
                            <span className="font-mono font-medium text-slate-900">
                              {formatCurrency((reportData as SalesReport).mobile_money_sales || 0, business?.currency)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Receipt Modal */}
      <ReceiptModal 
        isOpen={isReceiptOpen} 
        onClose={() => setIsReceiptOpen(false)} 
        sale={selectedTransaction} 
        items={receiptItems}
        onSaleVoided={() => {
          fetchData();
          setIsReceiptOpen(false);
        }}
      />
    </div>
  );
}
