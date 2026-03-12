import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

export default function TagInput({ tags = [], onChange }) {
  const [input, setInput] = useState('');

  function handleAdd(e) {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      const newTag = input.trim().toLowerCase().replace(/\s+/g, '-');
      if (!tags.includes(newTag)) {
        onChange([...tags, newTag]);
      }
      setInput('');
    }
  }

  function handleRemove(tag) {
    onChange(tags.filter(t => t !== tag));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <Badge key={tag} variant="outline" className="gap-1">
            {tag}
            <button 
              onClick={() => handleRemove(tag)} 
              className="text-xs hover:text-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input 
        type="text" 
        placeholder="Add tags (press Enter)..." 
        value={input} 
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleAdd}
        className="text-sm"
      />
    </div>
  );
}