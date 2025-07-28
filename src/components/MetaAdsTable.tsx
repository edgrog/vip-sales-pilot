import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Search, DollarSign, Tag, MapPin, Edit2, Save, X } from 'lucide-react';
import { MetaAd } from '@/hooks/useMetaAdsData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MetaAdsTableProps {
  data: MetaAd[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onAdUpdate: (adId: string, updates: Partial<MetaAd>) => void;
}

export const MetaAdsTable = ({ data, loading, error, onRefresh, onAdUpdate }: MetaAdsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterChain, setFilterChain] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<MetaAd>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Get unique values for filters
  const uniqueTags = [...new Set(data.map(ad => ad.tag).filter(Boolean))];
  const uniqueChains = [...new Set(data.map(ad => ad.chain).filter(Boolean))];

  // Filter data based on search and filters
  const filteredData = data.filter(ad => {
    const matchesSearch = ad.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.id.includes(searchTerm);
    const matchesTag = filterTag === 'all' || ad.tag === filterTag;
    const matchesChain = filterChain === 'all' || ad.chain === filterChain;
    
    return matchesSearch && matchesTag && matchesChain;
  });

  const totalSpend = filteredData.reduce((sum, ad) => sum + ad.spend, 0);

  const handleEdit = (ad: MetaAd) => {
    setEditingId(ad.id);
    setEditingData({
      tag: ad.tag,
      chain: ad.chain,
      state: ad.state,
      notes: ad.notes
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleSave = async (adId: string) => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('ad_tags')
        .upsert({
          ad_id: adId,
          tag: editingData.tag || null,
          chain: editingData.chain || null,
          state: editingData.state || null,
          notes: editingData.notes || null
        });

      if (error) throw error;

      onAdUpdate(adId, editingData);
      setEditingId(null);
      setEditingData({});
      
      toast({
        title: "Tags saved",
        description: "Ad tags have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving tags:', error);
      toast({
        title: "Error saving tags",
        description: "Failed to save ad tags. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Meta Ads Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Meta Ads Performance
              <Badge variant="secondary">{filteredData.length} ads</Badge>
            </CardTitle>
            <CardDescription>
              Live Meta Ads data combined with manual tags and chain assignments
            </CardDescription>
          </div>
          <Button 
            onClick={onRefresh} 
            variant="outline" 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
            <DollarSign className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Spend</p>
              <p className="text-2xl font-bold">${totalSpend.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-success/5 rounded-lg">
            <Tag className="w-8 h-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Tagged Ads</p>
              <p className="text-2xl font-bold">{data.filter(ad => ad.tag).length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-info/5 rounded-lg">
            <MapPin className="w-8 h-8 text-info" />
            <div>
              <p className="text-sm text-muted-foreground">Active Chains</p>
              <p className="text-2xl font-bold">{uniqueChains.length}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search ads by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {uniqueTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterChain} onValueChange={setFilterChain}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by chain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Chains</SelectItem>
              {uniqueChains.map(chain => (
                <SelectItem key={chain} value={chain}>{chain}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Name</TableHead>
                <TableHead>Ad ID</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Chain</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading Meta Ads data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No ads found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {ad.name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {ad.id}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ${ad.spend.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {editingId === ad.id ? (
                        <Input
                          value={editingData.tag || ''}
                          onChange={(e) => setEditingData(prev => ({ ...prev, tag: e.target.value }))}
                          placeholder="Enter tag"
                          className="w-32"
                        />
                      ) : ad.tag ? (
                        <Badge variant="secondary">{ad.tag}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === ad.id ? (
                        <Input
                          value={editingData.chain || ''}
                          onChange={(e) => setEditingData(prev => ({ ...prev, chain: e.target.value }))}
                          placeholder="Enter chain"
                          className="w-32"
                        />
                      ) : ad.chain ? (
                        <Badge variant="outline">{ad.chain}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === ad.id ? (
                        <Input
                          value={editingData.state || ''}
                          onChange={(e) => setEditingData(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="Enter state"
                          className="w-24"
                        />
                      ) : (
                        ad.state || <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {editingId === ad.id ? (
                        <Textarea
                          value={editingData.notes || ''}
                          onChange={(e) => setEditingData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Enter notes"
                          className="w-48 min-h-[60px]"
                          rows={2}
                        />
                      ) : ad.notes ? (
                        <span className="text-sm">{ad.notes}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === ad.id ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleSave(ad.id)}
                            disabled={saving}
                            className="h-8 w-8 p-0"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={saving}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(ad)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};