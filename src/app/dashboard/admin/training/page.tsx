'use client';

import { useEffect, useState } from 'react';
import { SubscriptionService } from '../../../../services/subscription.service';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit2, 
  Video, 
  FileText, 
  CheckCircle, 
  XCircle,
  Link as LinkIcon,
  Play
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminTrainingPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    type: 'VIDEO',
    is_active: true
  });

  const fetchResources = async () => {
    try {
      const data = await SubscriptionService.getTrainingResources();
      setResources(data);
    } catch (error) {
      toast.error('Failed to fetch training resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingResource) {
        await SubscriptionService.updateTrainingResource(editingResource.id, formData);
        toast.success('Resource updated successfully');
      } else {
        await SubscriptionService.createTrainingResource(formData);
        toast.success('Resource created successfully');
      }
      setIsModalOpen(false);
      setEditingResource(null);
      setFormData({ title: '', description: '', url: '', type: 'VIDEO', is_active: true });
      fetchResources();
    } catch (error) {
      toast.error('Failed to save resource');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      await SubscriptionService.deleteTrainingResource(id);
      toast.success('Resource deleted');
      fetchResources();
    } catch (error) {
      toast.error('Failed to delete resource');
    }
  };

  const openEditModal = (res: any) => {
    setEditingResource(res);
    setFormData({
      title: res.title,
      description: res.description,
      url: res.url,
      type: res.type,
      is_active: res.is_active
    });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="text-teal-600" />
            Installer Training Portal
          </h1>
          <p className="text-slate-500">Manage videos and documents for your affiliate installers</p>
        </div>
        <button 
          onClick={() => {
            setEditingResource(null);
            setFormData({ title: '', description: '', url: '', type: 'VIDEO', is_active: true });
            setIsModalOpen(true);
          }}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700 transition-colors"
        >
          <Plus size={20} />
          Add Resource
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res) => (
            <div key={res.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-slate-100 flex items-center justify-center relative">
                 {res.type === 'VIDEO' ? (
                   <Video className="text-slate-400" size={48} />
                 ) : (
                   <FileText className="text-slate-400" size={48} />
                 )}
                 {!res.is_active && (
                   <div className="absolute top-2 right-2 bg-rose-100 text-rose-600 px-2 py-1 rounded text-xs font-bold uppercase">Inactive</div>
                 )}
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{res.title}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(res)} className="p-1.5 text-slate-400 hover:text-teal-600">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(res.id)} className="p-1.5 text-slate-400 hover:text-rose-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4">{res.description}</p>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                   <LinkIcon size={12} />
                   <span className="truncate">{res.url}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic">
                 {editingResource ? 'Modify Resource' : 'New Knowledge Drop'}
               </h2>
               <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm text-slate-400 hover:text-slate-600 hover:scale-110 transition-all"><XCircle size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
               <div>
                  <label className="premium-label">Resource Title</label>
                  <input 
                    type="text" 
                    required
                    className="premium-input" 
                    placeholder="e.g. How to install the POS Terminal"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
               </div>

               <div>
                  <label className="premium-label">Description</label>
                  <textarea 
                    className="premium-input h-28 resize-none" 
                    placeholder="Briefly explain what this resource covers..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="premium-label">Content type</label>
                    <select 
                      className="premium-input"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="VIDEO">YouTube Video</option>
                      <option value="PDF">Document (PDF)</option>
                    </select>
                  </div>
                  <div>
                    <label className="premium-label">Visibility</label>
                    <select 
                      className="premium-input"
                      value={formData.is_active ? 'true' : 'false'}
                      onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}
                    >
                      <option value="true">Live & Active</option>
                      <option value="false">Hidden / Draft</option>
                    </select>
                  </div>
               </div>

               <div>
                  <label className="premium-label">Resource URL</label>
                  <input 
                    type="url" 
                    required
                    className="premium-input" 
                    placeholder="https://youtube.com/..."
                    value={formData.url}
                    onChange={e => setFormData({...formData, url: e.target.value})}
                  />
               </div>

               <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-500/20 transition-all"
                  >
                    {editingResource ? 'Update Portal' : 'Add to Portal'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
