'use client';
import { useState, useEffect } from 'react';
import { 
  FileDown, ShieldCheck, History, Filter, Calendar, 
  AlertTriangle, Eye, RefreshCw, ChevronDown, Clock,
  User, CreditCard, Package, X, Play, Pause
} from 'lucide-react';
import { ComplianceService, AuditLogEntry } from '@/services/compliance.service';
import toast from 'react-hot-toast';

const ACTION_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  created:      { label: 'Sale Created',    color: 'bg-emerald-100 text-emerald-700', icon: <CreditCard size={14} /> },
  completed:    { label: 'Sale Completed',  color: 'bg-blue-100 text-blue-700', icon: <CreditCard size={14} /> },
  voided:       { label: 'Sale Voided',     color: 'bg-rose-100 text-rose-700', icon: <AlertTriangle size={14} /> },
  updated:      { label: 'Sale Updated',    color: 'bg-amber-100 text-amber-700', icon: <RefreshCw size={14} /> },
  item_added:   { label: 'Item Added',      color: 'bg-purple-100 text-purple-700', icon: <Package size={14} /> },
  item_removed: { label: 'Item Removed',    color: 'bg-orange-100 text-orange-700', icon: <Package size={14} /> },
  resumed:      { label: 'Draft Resumed',   color: 'bg-cyan-100 text-cyan-700', icon: <Play size={14} /> },
  transferred:  { label: 'Bill Transferred',color: 'bg-indigo-100 text-indigo-700', icon: <RefreshCw size={14} /> },
  merged:       { label: 'Bills Merged',    color: 'bg-fuchsia-100 text-fuchsia-700', icon: <RefreshCw size={14} /> },
};

function getActionMeta(type: string) {
  return ACTION_LABELS[type] || { label: type, color: 'bg-slate-100 text-slate-700', icon: <Eye size={14} /> };
}

function parseDetails(detailsStr: string) {
  try {
    return JSON.parse(detailsStr);
  } catch {
    return null;
  }
}

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'export'>('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [actionFilter, setActionFilter] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');
  const [exporting, setExporting] = useState(false);
  const [moduleError, setModuleError] = useState(false);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditTrail();
  }, [activeTab, selectedDate, actionFilter]);

  useEffect(() => {
    // Default export dates to this month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setExportStart(firstDay.toISOString().split('T')[0]);
    setExportEnd(now.toISOString().split('T')[0]);
  }, []);

  // Replay Effect
  useEffect(() => {
    if (!isPlaying || auditLogs.length === 0) return;
    const reversedLogs = [...auditLogs].reverse(); // Chronological order for replay
    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= reversedLogs.length) {
        setIsPlaying(false);
        setHighlightIdx(-1);
        clearInterval(interval);
        return;
      }
      // Highlight the current log in the original (DESC) order
      const originalIdx = auditLogs.length - 1 - idx;
      setHighlightIdx(originalIdx);
      idx++;
    }, 1200);
    return () => clearInterval(interval);
  }, [isPlaying, auditLogs]);

  const fetchAuditTrail = async () => {
    setLoading(true);
    setModuleError(false);
    try {
      const data = await ComplianceService.getAuditTrail(selectedDate, actionFilter || undefined);
      setAuditLogs(data || []);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setModuleError(true);
      } else {
        toast.error('Failed to load audit trail');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!exportStart || !exportEnd) {
      toast.error('Please select a date range');
      return;
    }
    setExporting(true);
    try {
      const blob = await ComplianceService.downloadTaxReport(exportStart, exportEnd);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tax_report_${exportStart}_to_${exportEnd}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Tax report downloaded!');
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setModuleError(true);
      } else {
        toast.error('Failed to export report');
      }
    } finally {
      setExporting(false);
    }
  };

  if (moduleError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-50 flex items-center justify-center">
            <ShieldCheck size={36} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Compliance Module</h2>
          <p className="text-slate-500 mb-6">
            The Automated Compliance &amp; Reporting module is not active on your subscription. 
            Upgrade to access tax-ready exports and the full audit trail viewer.
          </p>
          <a href="/dashboard/subscription" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition">
            View Subscription Plans
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance &amp; Audit</h1>
          <p className="text-sm text-slate-500 mt-1">Tax-ready exports and detailed activity audit trails</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <History size={16} className="inline mr-1.5" />
            Audit Trail
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'export' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileDown size={16} className="inline mr-1.5" />
            Tax Export
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm text-slate-700 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
              <Filter size={16} className="text-slate-400" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-transparent text-sm text-slate-700 outline-none appearance-none pr-4"
              >
                <option value="">All Actions</option>
                <option value="created">Sale Created</option>
                <option value="completed">Sale Completed</option>
                <option value="voided">Voided</option>
                <option value="updated">Updated</option>
                <option value="item_added">Item Added</option>
                <option value="item_removed">Item Removed</option>
                <option value="resumed">Resumed</option>
                <option value="transferred">Transferred</option>
                <option value="merged">Merged</option>
              </select>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                isPlaying 
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              }`}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? 'Stop Replay' : 'Replay Day'}
            </button>
            <button
              onClick={fetchAuditTrail}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {/* Audit Log Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                Activity Log — {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <span className="text-xs text-slate-400">{auditLogs.length} events</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <History size={40} className="mb-3 opacity-50" />
                <p className="text-sm">No activity recorded for this date</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {auditLogs.map((log, idx) => {
                  const meta = getActionMeta(log.action_type);
                  const details = parseDetails(log.details);
                  const isHighlighted = highlightIdx === idx;

                  return (
                    <div
                      key={log.id}
                      className={`group px-6 py-4 flex items-start gap-4 transition-all duration-300 ${
                        isHighlighted 
                          ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-300 scale-[1.005]' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center pt-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${meta.color}`}>
                          {meta.icon}
                        </div>
                        {idx < auditLogs.length - 1 && (
                          <div className="w-px h-full bg-slate-200 mt-1 min-h-[20px]" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                            {meta.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            Sale #{log.sale_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-1">
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {log.user_name || `User #${log.performed_by}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        {/* Details */}
                        {details && (
                          <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-3 space-y-1">
                            {details.reason && (
                              <div><span className="font-medium text-slate-600">Reason:</span> {details.reason}</div>
                            )}
                            {details.product_name && (
                              <div><span className="font-medium text-slate-600">Product:</span> {details.product_name} (x{details.quantity || 1})</div>
                            )}
                            {details.amount_paid > 0 && (
                              <div><span className="font-medium text-slate-600">Amount:</span> ₦{Number(details.amount_paid).toLocaleString()}</div>
                            )}
                            {details.payment_method && (
                              <div><span className="font-medium text-slate-600">Payment:</span> {details.payment_method}</div>
                            )}
                            {details.from_table && (
                              <div><span className="font-medium text-slate-600">From Table:</span> {details.from_table} → {details.to_table}</div>
                            )}
                             {details.old_value !== undefined && details.new_value !== undefined && (
                              <div><span className="font-medium text-slate-600">Changed:</span> {String(details.old_value)} → {String(details.new_value)}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="space-y-6">
          {/* Tax Export Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <FileDown size={24} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Tax-Ready Export</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Generate a CSV/Excel file formatted for VAT/FIRS filings. 
                  Includes invoice numbers, subtotals, computed VAT (7.5%), payment methods, and status.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={exportStart}
                  onChange={(e) => setExportStart(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={exportEnd}
                  onChange={(e) => setExportEnd(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {exporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileDown size={18} />
                  Download Tax Report (CSV)
                </>
              )}
            </button>
          </div>

          {/* Info boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <h4 className="text-xs font-bold text-blue-700 mb-1">VAT Calculation</h4>
              <p className="text-xs text-blue-600">7.5% VAT is auto-calculated from your completed sales totals for FIRS filing.</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <h4 className="text-xs font-bold text-purple-700 mb-1">Data Included</h4>
              <p className="text-xs text-purple-600">Invoice No, Date, Subtotal, VAT, Total, Payment Method &amp; Status.</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <h4 className="text-xs font-bold text-amber-700 mb-1">Tip</h4>
              <p className="text-xs text-amber-600">Open the CSV in Excel or Google Sheets to format and submit to your tax authority.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
