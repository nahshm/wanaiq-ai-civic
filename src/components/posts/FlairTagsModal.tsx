import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';

interface Flair {
  id: string;
  name: string;
  color: string;
}

interface FlairTagsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFlairId: string | null;
  onFlairChange: (flairId: string | null) => void;
  tags: { id: string; name: string; description: string; enabled: boolean }[];
  onTagToggle: (tagId: string, enabled: boolean) => void;
}

export function FlairTagsModal({
  open,
  onOpenChange,
  selectedFlairId,
  onFlairChange,
  tags,
  onTagToggle,
}: FlairTagsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Example flair list - replace with real data or props if available
  const flairList: Flair[] = [
    { id: 'none', name: 'No flair', color: '' },
    { id: 'business', name: 'Business Security Questions & Discussion', color: 'bg-red-600' },
    { id: 'news', name: 'News - General', color: 'bg-blue-600' },
    { id: 'foss', name: 'FOSS Tool', color: 'bg-green-600' },
  ];

  const filteredFlairs = flairList.filter(flair =>
    flair.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            Add flair and tags
            <button onClick={() => onOpenChange(false)} aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <div>
            <label className="block mb-1 font-semibold">Flair *</label>
            <Input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="mb-3 bg-gray-800 text-white"
            />
            <RadioGroup
              value={selectedFlairId || 'none'}
              onValueChange={value => onFlairChange(value === 'none' ? null : value)}
              className="space-y-2 max-h-48 overflow-y-auto"
            >
              {filteredFlairs.map(flair => (
                <div key={flair.id} className="flex items-center gap-2">
                  <RadioGroupItem value={flair.id} id={`flair-${flair.id}`} />
                  <label htmlFor={`flair-${flair.id}`} className={`px-3 py-1 rounded-full cursor-pointer ${flair.color}`}>
                    {flair.name}
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Tags</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between">
                  <div>
                    <p>{tag.name}</p>
                    <p className="text-xs text-gray-400">{tag.description}</p>
                  </div>
                  <Switch
                    checked={tag.enabled}
                    onCheckedChange={checked => onTagToggle(tag.id, checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => onOpenChange(false)}>Add</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
