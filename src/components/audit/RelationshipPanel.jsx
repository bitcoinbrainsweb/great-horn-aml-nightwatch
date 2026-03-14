import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Link2 } from 'lucide-react';

export default function RelationshipPanel({ title, relationships }) {
  if (!relationships || relationships.length === 0) return null;

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {relationships.map((rel, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-purple-50 border border-purple-200 rounded">
              <div className="flex-1">
                <p className="text-xs font-medium text-purple-900">{rel.label}</p>
                {rel.subtitle && (
                  <p className="text-xs text-purple-600">{rel.subtitle}</p>
                )}
              </div>
              {rel.link && (
                <Link to={rel.link}>
                  <Badge variant="outline" className="text-xs bg-white hover:bg-purple-50 cursor-pointer">
                    View
                  </Badge>
                </Link>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}