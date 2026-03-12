import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Download } from 'lucide-react';

export default function BulkActionBar({ 
  selectedIds, 
  onBulkAction, 
  onExport, 
  entity_type,
  bulkActions = ['status', 'owner', 'tags']
}) {
  const [action, setAction] = React.useState('');
  const [value, setValue] = React.useState('');

  const handleExecute = () => {
    if (action && selectedIds.length > 0) {
      onBulkAction(action, value);
      setAction('');
      setValue('');
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3 mb-4">
      <CheckCircle2 className="w-4 h-4 text-blue-600" />
      <span className="text-sm font-medium text-blue-900">{selectedIds.length} selected</span>
      
      <div className="flex-1 flex items-center gap-2 ml-4">
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Select action..." />
          </SelectTrigger>
          <SelectContent>
            {bulkActions.includes('status') && <SelectItem value="status">Change Status</SelectItem>}
            {bulkActions.includes('owner') && <SelectItem value="owner">Assign Owner</SelectItem>}
            {bulkActions.includes('tags') && <SelectItem value="tags">Add Tags</SelectItem>}
            {bulkActions.includes('review_status') && <SelectItem value="review_status">Change Review Status</SelectItem>}
          </SelectContent>
        </Select>

        {action && (
          <input 
            type="text" 
            placeholder="Value..." 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 px-2 text-xs border border-slate-200 rounded"
          />
        )}

        <Button 
          size="sm" 
          onClick={handleExecute}
          disabled={!action || !value}
          className="h-8 text-xs"
        >
          Apply
        </Button>
      </div>

      <Button 
        size="sm" 
        variant="outline" 
        onClick={onExport}
        className="h-8 text-xs gap-1"
      >
        <Download className="w-3 h-3" />
        Export
      </Button>
    </div>
  );
}