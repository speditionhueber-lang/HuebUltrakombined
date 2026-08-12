import React, { useState } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';

interface GlobalDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export function GlobalDeleteDialog({ isOpen, onClose, onConfirm, title, description }: GlobalDeleteDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (password === 'bittedanke') {
      onConfirm();
      setPassword('');
      setError('');
    } else {
      setError('Falsches Kennwort');
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 bg-red-50 flex justify-between items-center">
          <div className="flex items-center space-x-3 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="font-bold text-lg">{title}</h2>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">{description}</p>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Kennwort zur Bestätigung</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => { if(e.key === 'Enter') handleConfirm(); }}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-red-500 focus:border-red-500"
              placeholder="Zauberwort eingeben..."
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
          <button onClick={handleClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg">
            Abbrechen
          </button>
          <button onClick={handleConfirm} className="px-4 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center">
            <Trash2 className="w-4 h-4 mr-2" /> Löschen bestätigen
          </button>
        </div>
      </div>
    </div>
  );
}
