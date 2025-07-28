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
import { MultiSelect } from '@/components/ui/multi-select';

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
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<MetaAd>>({});
  const [saving, setSaving] = useState(false);
  const [saveTimeoutId, setSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [lastChange, setLastChange] = useState<{adId: string, previousData: Partial<MetaAd>} | null>(null);
  const { toast } = useToast();

  // Color mappings for consistent data visualization
  const getChainColor = (chain: string) => {
    const chainColors: Record<string, string> = {
      'HEB': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700',
      'Kroger': 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700',
      'Target': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700',
      'Walmart': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700',
      'Safeway': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700',
      'Publix': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700',
      'Costco': 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-700',
      'Whole Foods': 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-700'
    };
    return chainColors[chain] || 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-700';
  };

  const getTagColor = (tag: string) => {
    const tagColors: Record<string, string> = {
      'AU/NZ': 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700',
      'Video': 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-700',
      'Static': 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-700',
      'Carousel': 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-700',
      'Collection': 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-700',
      'Retargeting': 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700'
    };
    return tagColors[tag] || 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-700';
  };

  const getStateColor = (state: string) => {
    const stateColors: Record<string, string> = {
      'CA': 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700',
      'TX': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700',
      'IL': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700',
      'MI': 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-700',
      'WI': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700',
      'FL': 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700',
      'OH': 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-700',
      'MA': 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-700'
    };
    return stateColors[state] || 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-700';
  };

  // Get unique values for filters
  const uniqueTags = [...new Set(data.flatMap(ad => ad.tag).filter(Boolean))];
  const uniqueChains = [...new Set(data.flatMap(ad => ad.chain).filter(Boolean))];

  // Filter out campaigns with 'AU/NZ' tag from frontend display
  const visibleData = data.filter(ad => !ad.tag.includes('AU/NZ'));

  // Filter visible data based on search and filters
  const filteredData = visibleData.filter(ad => {
    const matchesSearch = ad.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.id.includes(searchTerm);
    const matchesTag = filterTag === 'all' || ad.tag.includes(filterTag);
    const matchesChain = filterChain === 'all' || ad.chain.includes(filterChain);
    
    return matchesSearch && matchesTag && matchesChain;
  });

  const totalSpend = filteredData.reduce((sum, ad) => sum + ad.spend, 0);

  const handleEdit = (ad: MetaAd, field: string) => {
    // Clear any pending save timeout when starting to edit a new cell
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
      setSaveTimeoutId(null);
    }
    
    // Save current editing cell if there is one and it's different
    if (editingCell && editingCell !== `${ad.id}-${field}`) {
      const currentAdId = editingCell.split('-')[0];
      handleAutoSave(currentAdId, false); // Save without timeout
    }

    const cellId = `${ad.id}-${field}`;
    setEditingCell(cellId);
    
    // Always load the current ad data to ensure we have the latest values
    const currentAd = data.find(a => a.id === ad.id) || ad;
    setEditingData({
      tag: currentAd.tag,
      chain: currentAd.chain,
      state: currentAd.state,
      notes: currentAd.notes
    });
  };

  const handleCancel = () => {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
      setSaveTimeoutId(null);
    }
    setEditingCell(null);
    setEditingData({});
  };

  const handleAutoSave = async (adId: string, useTimeout: boolean = true) => {
    if (saving) return;
    
    const performSave = async () => {
      setSaving(true);
      try {
        const { error } = await (supabase as any)
          .from('ad_tags')
          .upsert({
            ad_id: adId,
            tag: editingData.tag?.length ? editingData.tag.join(', ') : null,
            chain: editingData.chain?.length ? editingData.chain.join(', ') : null,
            state: editingData.state?.length ? editingData.state.join(', ') : null,
            notes: editingData.notes || null
          });

        if (error) throw error;

        onAdUpdate(adId, editingData);
        setEditingCell(null);
        setEditingData({});
        
        toast({
          title: "Saved",
          description: "Changes saved successfully.",
        });
      } catch (error) {
        console.error('Error saving tags:', error);
        toast({
          title: "Error saving",
          description: "Failed to save changes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
        setSaveTimeoutId(null);
      }
    };

    if (useTimeout) {
      // Clear any existing timeout
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
      }
      
      // Set a longer timeout to ensure multi-select values are captured
      const timeoutId = setTimeout(performSave, 400);
      setSaveTimeoutId(timeoutId);
    } else {
      // Save immediately
      await performSave();
    }
  };

  const handleAutoSaveWithData = async (adId: string, dataToSave: Partial<MetaAd>, exitEditMode: boolean = false) => {
    if (saving) return;
    
    // Store the previous data for undo functionality
    const currentAd = data.find(ad => ad.id === adId);
    if (currentAd) {
      setLastChange({
        adId,
        previousData: {
          tag: currentAd.tag,
          chain: currentAd.chain,
          state: currentAd.state,
          notes: currentAd.notes
        }
      });
    }
    
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('ad_tags')
        .upsert({
          ad_id: adId,
          tag: dataToSave.tag?.length ? dataToSave.tag.join(', ') : null,
          chain: dataToSave.chain?.length ? dataToSave.chain.join(', ') : null,
          state: dataToSave.state?.length ? dataToSave.state.join(', ') : null,
          notes: dataToSave.notes || null
        });

      if (error) throw error;

      onAdUpdate(adId, dataToSave);
      
      // Update editingData to stay in sync with saved data
      if (!exitEditMode) {
        setEditingData(dataToSave);
      } else {
        setEditingCell(null);
        setEditingData({});
      }
      
      toast({
        title: "Saved",
        description: "Changes saved successfully.",
        action: (
          <button
            onClick={() => handleUndo()}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Undo
          </button>
        ),
      });
    } catch (error) {
      console.error('Error saving tags:', error);
      toast({
        title: "Error saving",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setSaveTimeoutId(null);
    }
  };

  const handleUndo = async () => {
    if (!lastChange || saving) return;
    
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('ad_tags')
        .upsert({
          ad_id: lastChange.adId,
          tag: lastChange.previousData.tag?.length ? lastChange.previousData.tag.join(', ') : null,
          chain: lastChange.previousData.chain?.length ? lastChange.previousData.chain.join(', ') : null,
          state: lastChange.previousData.state?.length ? lastChange.previousData.state.join(', ') : null,
          notes: lastChange.previousData.notes || null
        });

      if (error) throw error;

      onAdUpdate(lastChange.adId, lastChange.previousData);
      setLastChange(null);
      
      toast({
        title: "Undone",
        description: "Changes have been reverted.",
      });
    } catch (error) {
      console.error('Error undoing changes:', error);
      toast({
        title: "Error undoing",
        description: "Failed to undo changes. Please try again.",
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
              <p className="text-2xl font-bold">{visibleData.filter(ad => ad.tag.length > 0).length}</p>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading Meta Ads data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                      {editingCell === `${ad.id}-tag` ? (
                        <MultiSelect
                          options={[...uniqueTags, 'AU/NZ'].filter((tag, index, arr) => arr.indexOf(tag) === index)}
                          value={editingData.tag || []}
                          onChange={(value) => {
                            const newData = { ...editingData, tag: value };
                            setEditingData(newData);
                            // Save immediately with the new data
                            handleAutoSaveWithData(ad.id, newData, false);
                          }}
                          onBlur={() => {
                            setEditingCell(null);
                            setEditingData({});
                          }}
                          placeholder="Select tags"
                          className="w-48"
                        />
                      ) : (
                        <div 
                          className="cursor-pointer hover:bg-muted/50 rounded p-1 -m-1"
                          onClick={() => handleEdit(ad, 'tag')}
                        >
                          {ad.tag.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {ad.tag.map((tag, index) => (
                                <Badge key={index} variant="outline" className={getTagColor(tag)}>{tag}</Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Click to add tags</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCell === `${ad.id}-chain` ? (
                        <MultiSelect
                          options={uniqueChains}
                          value={editingData.chain || []}
                          onChange={(value) => {
                            const newData = { ...editingData, chain: value };
                            setEditingData(newData);
                            // Save immediately with the new data
                            handleAutoSaveWithData(ad.id, newData, false);
                          }}
                          onBlur={() => {
                            setEditingCell(null);
                            setEditingData({});
                          }}
                          placeholder="Select chains"
                          className="w-48"
                        />
                      ) : (
                        <div 
                          className="cursor-pointer hover:bg-muted/50 rounded p-1 -m-1"
                          onClick={() => handleEdit(ad, 'chain')}
                        >
                          {ad.chain.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {ad.chain.map((chain, index) => (
                                <Badge key={index} variant="outline" className={getChainColor(chain)}>{chain}</Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Click to add chains</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCell === `${ad.id}-state` ? (
                        <MultiSelect
                          options={['ALL', 'CA', 'TX', 'IL', 'MI', 'WI', 'FL', 'OH', 'MA']}
                          value={editingData.state || []}
                          onChange={(value) => {
                            console.log('State onChange:', value);
                            let newStateValue = value;
                            
                            // Handle 'ALL' selection
                            if (value.includes('ALL')) {
                              if (value.length === 1) {
                                // If only 'ALL' is selected, select all states
                                newStateValue = ['CA', 'TX', 'IL', 'MI', 'WI', 'FL', 'OH', 'MA'];
                              } else {
                                // If 'ALL' plus other states, remove 'ALL' and keep individual states
                                newStateValue = value.filter(state => state !== 'ALL');
                              }
                            }
                            
                            const newData = { ...editingData, state: newStateValue };
                            setEditingData(newData);
                            // Save immediately with the new data
                            handleAutoSaveWithData(ad.id, newData, false);
                          }}
                          onBlur={() => {
                            setEditingCell(null);
                            setEditingData({});
                          }}
                          placeholder="Select states"
                          className="w-32"
                        />
                      ) : (
                        <div 
                          className="cursor-pointer hover:bg-muted/50 rounded p-1 -m-1"
                          onClick={() => handleEdit(ad, 'state')}
                        >
                          {ad.state.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {ad.state.map((state, index) => (
                                <Badge key={index} variant="outline" className={getStateColor(state)}>{state}</Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Click to add states</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {editingCell === `${ad.id}-notes` ? (
                        <Textarea
                          value={editingData.notes || ''}
                          onChange={(e) => setEditingData(prev => ({ ...prev, notes: e.target.value }))}
                          onBlur={() => handleAutoSave(ad.id)}
                          placeholder="Enter notes"
                          className="w-48 min-h-[60px]"
                          rows={2}
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="cursor-pointer hover:bg-muted/50 rounded p-1 -m-1"
                          onClick={() => handleEdit(ad, 'notes')}
                        >
                          {ad.notes ? (
                            <span className="text-sm">{ad.notes}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Click to add notes</span>
                          )}
                        </div>
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