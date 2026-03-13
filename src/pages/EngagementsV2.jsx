import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from '@/components/ui/PageHeader';

export default function EngagementsV2() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: engagements = [], isLoading } = useQuery({
    queryKey: ['engagements'],
    queryFn: () => base44.entities.Engagement.list('-created_date')
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const getStatusBadge = (status) => {
    const variants = {
      'Draft': 'secondary',
      'In Progress': 'default',
      'In Review': 'outline',
      'Approved': 'default',
      'Finalized': 'default',
      'Archived': 'secondary'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getRatingBadge = (rating) => {
    if (!rating || rating === 'N/A') return null;
    const colors = {
      'Effective': 'bg-green-100 text-green-800',
      'Improvements Needed': 'bg-yellow-100 text-yellow-800',
      'Deficient': 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={colors[rating] || 'bg-gray-100 text-gray-800'}>
        {rating}
      </Badge>
    );
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.client_name || '-';
  };

  const filteredEngagements = engagements.filter(eng => {
    const matchesSearch = eng.engagement_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || eng.engagement_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || eng.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Engagements"
        subtitle="Manage audits, effectiveness reviews, and assessments"
      >
        <Button onClick={() => navigate('/EngagementDetailV2?new=true')}>
          <Plus className="h-4 w-4 mr-2" />
          New Engagement
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search engagements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Effectiveness Review">Effectiveness Review</SelectItem>
                <SelectItem value="Risk Assessment">Risk Assessment</SelectItem>
                <SelectItem value="Control Testing">Control Testing</SelectItem>
                <SelectItem value="Regulatory Exam">Regulatory Exam</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Finalized">Finalized</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : filteredEngagements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>No engagements found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Review Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEngagements.map((eng) => (
                  <TableRow 
                    key={eng.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/EngagementDetailV2?id=${eng.id}`)}
                  >
                    <TableCell className="font-medium">{eng.engagement_name}</TableCell>
                    <TableCell>{eng.engagement_type}</TableCell>
                    <TableCell>{getClientName(eng.client_id)}</TableCell>
                    <TableCell>{eng.engagement_owner}</TableCell>
                    <TableCell>
                      {eng.review_period_start && eng.review_period_end
                        ? `${eng.review_period_start} to ${eng.review_period_end}`
                        : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(eng.status)}</TableCell>
                    <TableCell>{getRatingBadge(eng.overall_rating)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}