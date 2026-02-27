'use client';

import React, { useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Download, ExternalLink, Share2, Printer, CheckCircle2, QrCode as QrIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AuthService } from "@/services/auth.service"

export default function QRMenuPage() {
  const { business, refreshProfile } = useAuth();
  const [newSlug, setNewSlug] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const publicUrl = business?.slug 
    ? `${window.location.origin}/menu/${business.slug}` 
    : '';

  const handleCreateSlug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlug || !business?.id) return;

    // Validate slug (letters, numbers, hyphens only)
    if (!/^[a-z0-9-]+$/.test(newSlug)) {
      toast.error('Slug can only contain lowercase letters, numbers, and hyphens.');
      return;
    }

    setIsSubmitting(true);
    try {
      await AuthService.updateBusiness(business.id, { slug: newSlug });
      toast.success('Your digital menu address has been created!');
      await refreshProfile(); // Refresh to get the new slug
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create menu address. Try a different slug.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 900, 900);
        
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${business?.name || 'business'}-qr-menu.png`;
        link.href = url;
        link.click();
        toast.success('QR Code downloaded successfully!');
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const copyLink = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const printQR = () => {
    window.print();
  };

  if (!business?.slug) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
            <QrIcon size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Activate Your Digital Menu</h1>
          <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
            Choose a unique web address for your digital menu. Customers will scan this to see your live catalog.
          </p>
        </div>

        <form onSubmit={handleCreateSlug} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-700">Menu Web Address</label>
            
            <div className="flex items-center gap-2 p-1 bg-slate-50 border-2 border-slate-100 rounded-2xl focus-within:border-teal-500 transition-all">
              <span className="pl-4 text-slate-400 font-medium select-none whitespace-nowrap hidden sm:inline">
                betadaypos.com/menu/
              </span>
              <input 
                type="text"
                placeholder="my-cool-lounge"
                className="flex-1 bg-transparent py-3 pr-4 outline-none font-bold text-slate-900 placeholder:text-slate-300"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                required
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium ml-1">Use lowercase letters, numbers, and hyphens ONLY.</p>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !newSlug}
            className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98]"
          >
            {isSubmitting ? 'Activating...' : 'Activate My Digital Menu'}
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {[
             { title: 'Your Real Products', text: 'Shows your actual inventory & prices.' },
             { title: 'Zero App Installs', text: 'Works in any mobile browser.' },
             { title: 'Always Up-to-Date', text: 'Changes in inventory reflect instantly.' },
           ].map((item, i) => (
             <div key={i} className="p-4 bg-slate-50 rounded-2xl text-center space-y-1">
               <h4 className="text-[10px] font-black uppercase text-teal-600 tracking-widest">{item.title}</h4>
               <p className="text-[10px] text-slate-500 font-medium">{item.text}</p>
             </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-teal-100 text-teal-600 rounded-xl">
              <QrIcon size={28} />
            </div>
            Digital QR Menu
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">
            Allow customers to view your live menu by scanning a QR code.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Share2 size={16} />
            Copy Menu Link
          </button>
          <a 
            href={publicUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-all shadow-md shadow-teal-600/20"
          >
            <ExternalLink size={16} />
            Preview Menu
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* QR Code Presentation */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-2 bg-teal-600"></div>
            
            <div className="mb-6">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-4 mx-auto">
                {business.name.charAt(0)}
              </div>
              <h3 className="font-black text-slate-900 text-xl tracking-tight">{business.name}</h3>
              <p className="text-xs text-teal-600 font-bold uppercase tracking-widest mt-1">Scan to View Menu</p>
            </div>

            <div ref={qrRef} className="p-4 bg-white border-2 border-slate-100 rounded-3xl mb-8 group-hover:scale-105 transition-transform duration-500 shadow-sm">
              <QRCodeSVG 
                value={publicUrl} 
                size={220}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: "", // Optional logo URL
                  x: undefined,
                  y: undefined,
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 w-full print:hidden">
              <button 
                onClick={downloadQR}
                className="flex flex-col items-center gap-2 p-4 bg-slate-50 hover:bg-teal-50 rounded-2xl border border-slate-100 hover:border-teal-200 text-slate-600 hover:text-teal-700 transition-all"
              >
                <Download size={20} />
                <span className="text-[10px] font-black uppercase tracking-wider">Download</span>
              </button>
              <button 
                onClick={printQR}
                className="flex flex-col items-center gap-2 p-4 bg-slate-50 hover:bg-teal-50 rounded-2xl border border-slate-100 hover:border-teal-200 text-slate-600 hover:text-teal-700 transition-all"
              >
                <Printer size={20} />
                <span className="text-[10px] font-black uppercase tracking-wider">Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* Benefits & Instructions */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
              How it works
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Download & Print</h4>
                    <p className="text-sm text-slate-500 mt-1">Download the high-resolution PNG and print it on table tent cards or posters.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Place on Tables</h4>
                    <p className="text-sm text-slate-500 mt-1">Put the QR codes where customers can easily scan them with their phones.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Live Updates</h4>
                    <p className="text-sm text-slate-500 mt-1">Any changes you make to your products in the Inventory tab reflect instantly on the QR menu.</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-4 tracking-tight">Pro Tips</h4>
                <ul className="space-y-3">
                  <li className="flex gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-teal-500 shrink-0 mt-0.5" />
                    <span>Always test your printed QR codes once with a phone camera.</span>
                  </li>
                  <li className="flex gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-teal-500 shrink-0 mt-0.5" />
                    <span>Laminate your printed cards to protect them from spills.</span>
                  </li>
                  <li className="flex gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-teal-500 shrink-0 mt-0.5" />
                    <span>Upload beautiful product images in the Inventory tab to increase sales.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-teal-600 p-8 rounded-[2rem] text-white overflow-hidden relative shadow-lg shadow-teal-600/20">
             <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-white/10 rounded-full"></div>
             <div className="relative z-10">
               <h3 className="text-xl font-bold mb-2">Want to accept orders directly?</h3>
               <p className="text-teal-50/80 text-sm mb-6 max-w-lg">
                 Upgrade to our <strong>Order-at-Table</strong> module to allow customers to not just view the menu, but also place orders and pay directly from their phones.
               </p>
               <button className="px-6 py-2.5 bg-white text-teal-600 rounded-xl text-sm font-black uppercase tracking-wider hover:bg-teal-50 transition-all shadow-lg">
                 Coming Soon
               </button>
             </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #qr-container, #qr-container * {
            visibility: visible;
          }
          #qr-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
