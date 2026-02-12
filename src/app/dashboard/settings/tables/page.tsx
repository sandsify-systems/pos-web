'use client';

import React, { useState, useEffect } from "react"
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { TableService, Table } from "@/services/table.service";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit, 
  Users, 
  Armchair,
  Loader2,
  X 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function TableManagementPage() {
  const router = useRouter();
  
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [currentTable, setCurrentTable] = useState<Partial<Table>>({
    table_number: "",
    section: "Main Hall",
    capacity: 4
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const data = await TableService.listTables();
      setTables(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch tables");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentTable.table_number) {
      toast.error("Table number is required");
      return;
    }

    try {
      if (isEditing && currentTable.id) {
        await TableService.updateTable(currentTable.id, currentTable);
        toast.success("Table updated");
      } else {
        await TableService.createTable(currentTable);
        toast.success("Table created");
      }
      setModalOpen(false);
      fetchTables();
    } catch (error) {
       toast.error("Failed to save table");
    }
  };

  const handleDelete = async (id: number) => {
     if(!confirm("Are you sure you want to delete this table?")) return;
     try {
       await TableService.deleteTable(id);
       toast.success("Table deleted");
       fetchTables();
     } catch (e) {
       toast.error("Failed to delete table");
     }
  };

  const openAddModal = () => {
    setCurrentTable({ table_number: "", section: "Main Hall", capacity: 4 });
    setIsEditing(false);
    setModalOpen(true);
  };

  const openEditModal = (table: Table) => {
    setCurrentTable(table);
    setIsEditing(true);
    setModalOpen(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
       {/* Header */}
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Table Management</h1>
              <p className="text-slate-500">Configure floor plan and seating arrangements</p>
            </div>
         </div>
         <button 
           onClick={openAddModal}
           className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
         >
           <Plus size={20} />
           Add Table
         </button>
       </div>

       {loading ? (
          <div className="flex items-center justify-center h-64">
             <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
       ) : tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
             <Armchair size={48} className="text-slate-300 mb-4" />
             <p className="text-slate-500 mb-4 font-medium">No tables found</p>
             <button 
               onClick={openAddModal}
               className="text-teal-600 font-bold hover:underline"
             >
               Add your first table
             </button>
          </div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
             {tables.map(table => (
                <div key={table.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all group">
                   <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-full ${table.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                         <Armchair size={24} />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => openEditModal(table)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                         >
                            <Edit size={16} />
                         </button>
                         <button 
                            onClick={() => handleDelete(table.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                   </div>
                   
                   <div>
                      <h3 className="font-bold text-lg text-slate-900 mb-1">{table.table_number}</h3>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wide mb-3">
                         {table.section || 'General Section'}
                      </p>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                         <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                            <Users size={16} />
                            <span>{table.capacity} Seats</span>
                         </div>
                         <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                            table.status === 'available' 
                             ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                             : 'bg-rose-50 text-rose-700 border-rose-100'
                         }`}>
                             {table.status.toUpperCase()}
                         </span>
                      </div>
                   </div>
                </div>
             ))}
          </div>
       )}

       {/* Modal */}
       {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                   <h3 className="font-bold text-lg text-slate-900">
                      {isEditing ? 'Edit Table' : 'New Table'}
                   </h3>
                   <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                      <X size={20} />
                   </button>
                </div>
                
                <div className="p-6 space-y-4">
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Table Number / Name</label>
                      <input 
                        type="text"
                        placeholder="e.g. T-12, VIP-1"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        value={currentTable.table_number}
                        onChange={(e) => setCurrentTable({...currentTable, table_number: e.target.value})}
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Section</label>
                      <input 
                        type="text"
                        placeholder="e.g. Main Hall, Patio"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        value={currentTable.section}
                        onChange={(e) => setCurrentTable({...currentTable, section: e.target.value})}
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Seating Capacity</label>
                      <input 
                        type="number"
                        placeholder="4"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        value={currentTable.capacity}
                        onChange={(e) => setCurrentTable({...currentTable, capacity: parseInt(e.target.value) || 0})}
                      />
                   </div>

                   <button 
                     onClick={handleSave}
                     className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm transition-all mt-4"
                   >
                     {isEditing ? 'Update Table' : 'Create Table'}
                   </button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
}
