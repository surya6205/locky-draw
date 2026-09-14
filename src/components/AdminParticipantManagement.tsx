import React, { useState } from 'react';
import { Participant, POPULAR_LOCATIONS } from '../types';
import { updateParticipantDetails, deleteParticipant } from '../lib/drawService';
import {
  Search,
  Download,
  Printer,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2,
  FileSpreadsheet,
  FileCode,
  Users,
} from 'lucide-react';

interface AdminParticipantManagementProps {
  participants: Participant[];
  onParticipantUpdated?: (updated: Participant) => void;
  onParticipantDeleted?: (id: string) => void;
}

export const AdminParticipantManagement: React.FC<AdminParticipantManagementProps> = ({
  participants,
  onParticipantUpdated,
  onParticipantDeleted,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editForm, setEditForm] = useState<{
    fullName: string;
    fatherName: string;
    motherName: string;
    mobile: string;
    location: string;
  }>({
    fullName: '',
    fatherName: '',
    motherName: '',
    mobile: '',
    location: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter participants
  const filtered = participants.filter((p) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      p.drawNumber.toLowerCase().includes(q) ||
      p.fullName.toLowerCase().includes(q) ||
      p.fatherName.toLowerCase().includes(q) ||
      p.motherName.toLowerCase().includes(q) ||
      p.mobile.includes(q) ||
      p.location.toLowerCase().includes(q)
    );
  });

  const handleOpenEdit = (p: Participant) => {
    setEditingParticipant(p);
    setEditForm({
      fullName: p.fullName,
      fatherName: p.fatherName,
      motherName: p.motherName,
      mobile: p.mobile,
      location: p.location,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant) return;

    try {
      setIsSavingEdit(true);
      await updateParticipantDetails(editingParticipant, editForm);
      if (onParticipantUpdated) {
        onParticipantUpdated({
          ...editingParticipant,
          ...editForm,
        });
      }
      setEditingParticipant(null);
    } catch (err: any) {
      alert('Error updating participant details: ' + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (p: Participant) => {
    const confirmed = confirm(
      `Are you sure you want to permanently delete participant "${p.fullName}" (Draw Number: ${p.drawNumber})?`
    );
    if (!confirmed) return;

    try {
      setDeletingId(p.id);
      await deleteParticipant(p);
      if (onParticipantDeleted) {
        onParticipantDeleted(p.id);
      }
    } catch (err: any) {
      alert('Error deleting participant: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    if (participants.length === 0) return;
    const headers = [
      'Lucky Draw Number',
      'Full Name',
      'Father Name',
      'Mother Name',
      'Mobile Number',
      'City / Location',
      'Registration Date',
    ];
    const rows = participants.map((p) => [
      `"${p.drawNumber}"`,
      `"${p.fullName}"`,
      `"${p.fatherName}"`,
      `"${p.motherName}"`,
      `"${p.mobile}"`,
      `"${p.location}"`,
      `"${new Date(p.createdAt).toLocaleString('en-IN')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DHARMALABH_Participants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (participants.length === 0) return;
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(participants, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `DHARMALABH_Participants_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, number, father's name, city or mobile..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium mr-2">
            Total: <strong>{filtered.length}</strong> / {participants.length}
          </span>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            title="Download CSV file"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            title="Download JSON backup"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            title="Print List"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Participant Table */}
      <div id="printable-area" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Number</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Father Name</th>
                <th className="py-3 px-4">Mother Name</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">City / Location</th>
                <th className="py-3 px-4">Registration Date</th>
                <th className="py-3 px-4 text-right print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-amber-700 whitespace-nowrap">
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300">
                        {p.drawNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{p.fullName}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{p.fatherName}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{p.motherName}</td>
                    <td className="py-3 px-4 font-mono text-slate-800 whitespace-nowrap">+91 {p.mobile}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{p.location}</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right print:hidden whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          title="Edit participant details"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-100 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deletingId === p.id}
                          title="Delete participant"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                        >
                          {deletingId === p.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No participants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Participant Modal */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Edit Participant Details</h3>
                <span className="text-xs text-amber-700 font-mono">
                  Draw Number: {editingParticipant.drawNumber}
                </span>
              </div>
              <button
                onClick={() => setEditingParticipant(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Participant Name</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Father's Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.fatherName}
                    onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mother's Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.motherName}
                    onChange={(e) => setEditForm({ ...editForm, motherName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number (10 digits)</label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={editForm.mobile}
                  onChange={(e) =>
                    setEditForm({ ...editForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">City / Location</label>
                <input
                  type="text"
                  required
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingParticipant(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
