import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link2 } from 'lucide-react';

export default function AuditJumpLinks({ links }) {
  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          Jump To
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {links.map(link => (
            <button
              key={link.id}
              onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' })}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 transition-colors"
            >
              {link.label}
              {link.count !== undefined && (
                <Badge variant="outline" className="ml-2 bg-white text-blue-700 border-blue-300">
                  {link.count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}