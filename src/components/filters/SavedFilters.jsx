import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Save, Trash2, Download } from 'lucide-react';

export default function SavedFilters({ entityName, currentFilters, onLoadFilter }) {
  const [filters, setFilters] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');

  const storageKey = `saved_filters_${entityName}`;

  useEffect(() => {
    loadFilters();
  }, [entityName]);

  function loadFilters() {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setFilters(JSON.parse(stored));
    }
  }

  function handleSave() {
    if (!filterName.trim()) return;
    const newFilter = {
      id: Date.now(),
      name: filterName,
      filters: currentFilters,
      created: new Date().toLocaleString()
    };
    const updated = [...filters, newFilter];
    setFilters(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setFilterName('');
    setShowSaveDialog(false);
  }

  function handleDelete(id) {
    const updated = filters.filter(f => f.id !== id);
    setFilters(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => setShowSaveDialog(true)}
          className="gap-1 text-xs"
        >
          <Save className="w-3 h-3" />
          Save Filter
        </Button>

        {filters.length > 0 && (
          <div className="relative group">
            <Button size="sm" variant="outline" className="gap-1 text-xs">
              <Download className="w-3 h-3" />
              Load Filter
            </Button>
            <div className="absolute right-0 mt-0 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {filters.map(f => (
                <div key={f.id} className="flex items-center justify-between p-2 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                  <button 
                    onClick={() => onLoadFilter(f.filters)}
                    className="flex-1 text-left text-xs text-slate-700 hover:text-slate-900"
                  >
                    <div className="font-medium">{f.name}</div>
                    <div className="text-[10px] text-slate-500">{f.created}</div>
                  </button>
                  <button 
                    onClick={() => handleDelete(f.id)}
                    className="text-slate-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Current Filter</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Filter name (e.g., 'Open High Severity')"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} disabled={!filterName.trim()} className="flex-1">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}