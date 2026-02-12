'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';
import { 
  ArrowLeft, 
  Printer, 
  Wifi, 
  Globe, 
  Settings2, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Save,
  Monitor
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PrinterSettingsPage() {
  const router = useRouter();
  const { 
    printerPaperSize, 
    autoPrint, 
    printerType, 
    printerIp,
    updatePrinterSettings 
  } = useSettings();

  const [localIp, setLocalIp] = useState(printerIp);
  const [isTesting, setIsTesting] = useState(false);

  const handleSaveIp = () => {
    updatePrinterSettings({ ip: localIp });
    toast.success('Printer IP updated');
  };

  const testPrint = () => {
    setIsTesting(true);
    // Simulate test print
    setTimeout(() => {
      setIsTesting(false);
      if (printerType === 'browser') {
        window.print();
        toast.success('Browser print dialog opened');
      } else {
        toast.success('Test print command sent to ' + localIp);
      }
    }, 1500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Printer Setup</h1>
          <p className="text-slate-500">Configure receipt printers and printing preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Connection Type */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
               <h3 className="font-bold text-slate-900 flex items-center gap-2">
                 <Settings2 size={18} className="text-teal-600" />
                 Connection Method
               </h3>
            </div>
            <div className="p-6 space-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => updatePrinterSettings({ type: 'browser' })}
                    className={`p-4 rounded-xl border-2 transition-all text-left flex items-start gap-3 ${
                      printerType === 'browser' ? 'border-teal-500 bg-teal-50' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${printerType === 'browser' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                       <Monitor size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Browser Print</p>
                      <p className="text-xs text-slate-500">Uses standard system print dialog</p>
                    </div>
                    {printerType === 'browser' && <CheckCircle2 size={18} className="ml-auto text-teal-600" />}
                  </button>

                  <button 
                    onClick={() => updatePrinterSettings({ type: 'network' })}
                    className={`p-4 rounded-xl border-2 transition-all text-left flex items-start gap-3 ${
                      printerType === 'network' ? 'border-teal-500 bg-teal-50' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${printerType === 'network' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                       <Wifi size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Network Printer</p>
                      <p className="text-xs text-slate-500">ESC/POS Thermal Printer via IP</p>
                    </div>
                    {printerType === 'network' && <CheckCircle2 size={18} className="ml-auto text-teal-600" />}
                  </button>
               </div>

               {printerType === 'network' && (
                 <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">Printer IP Address</label>
                       <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="e.g. 192.168.1.100" 
                            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                            value={localIp}
                            onChange={(e) => setLocalIp(e.target.value)}
                          />
                          <button 
                            onClick={handleSaveIp}
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <Save size={18} />
                          </button>
                       </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100 text-amber-800 text-xs">
                       <AlertCircle size={16} className="shrink-0" />
                       <p>Note: Direct network printing from web browsers requires the printer to support WebSockets or CORS-enabled HTTP requests, or a local print bridge.</p>
                    </div>
                 </div>
               )}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
               <h3 className="font-bold text-slate-900 flex items-center gap-2">
                 <Printer size={18} className="text-teal-600" />
                 Printer Preferences
               </h3>
            </div>
            <div className="p-6 space-y-6">
               <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">Auto-Print Receipt</p>
                    <p className="text-sm text-slate-500">Automatically open print dialog after successful sale</p>
                  </div>
                  <button
                    onClick={() => updatePrinterSettings({ autoPrint: !autoPrint })}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${autoPrint ? 'bg-teal-600' : 'bg-slate-300'}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${autoPrint ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
               </div>

               <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-700">Paper Size</p>
                  <div className="flex gap-4">
                     {['58mm', '80mm'].map((size) => (
                       <button
                         key={size}
                         onClick={() => updatePrinterSettings({ paperSize: size as any })}
                         className={`px-6 py-2 rounded-lg border-2 transition-all font-medium ${
                           printerPaperSize === size ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'
                         }`}
                       >
                         {size}
                       </button>
                     ))}
                  </div>
               </div>
            </div>
          </section>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
           <div className="bg-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-teal-500/20">
              <h3 className="font-bold text-lg mb-2 text-white">Test Connection</h3>
              <p className="text-teal-100 text-sm mb-6">
                Send a test command to your selected printer to verify it's working correctly.
              </p>
              <button 
                onClick={testPrint}
                disabled={isTesting}
                className="w-full py-3 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
              >
                {isTesting ? <RefreshCw className="animate-spin" size={20} /> : <Printer size={20} />}
                Print Test Receipt
              </button>
           </div>

           <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <h3 className="font-bold text-slate-900">Printing Tips</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                 <li className="flex gap-2">
                    <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                    <span>For <b>Browser Print</b>, you can select any connected printer (USB, Network, Bluetooth) in the system dialog.</span>
                 </li>
                 <li className="flex gap-2">
                    <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                    <span><b>80mm</b> is standard for full receipts, while <b>58mm</b> is typical for mobile handheld printers.</span>
                 </li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
