import { useState, useMemo } from "react";
import { useAdsDashboardData } from "@/hooks/useAdsDashboardData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit, Save, X } from "lucide-react";

interface AdsDashboardTableProps {
  selectedMonth: string;
  selectedChain: string;
  sortBy: "spend" | "sales" | "cost_per_case";
}

interface EditingRow {
  ad_id: string;
  chain: string;
  state: string;
}

export const AdsDashboardTable = ({ selectedMonth, selectedChain, sortBy }: AdsDashboardTableProps) => {
  const { data, loading, error, updateAdTag } = useAdsDashboardData();
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply filters
    if (selectedChain) {
      filtered = filtered.filter(row => row.chain === selectedChain);
    }

    // Sort data
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "spend":
          return b.spend - a.spend;
        case "sales":
          return (b.monthly_sales || 0) - (a.monthly_sales || 0);
        case "cost_per_case":
          return (b.cost_per_case || 0) - (a.cost_per_case || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [data, selectedChain, sortBy]);

  const handleEdit = (row: any) => {
    setEditingRow({
      ad_id: row.ad_id,
      chain: row.chain || "",
      state: row.state || ""
    });
  };

  const handleSave = async () => {
    if (editingRow) {
      await updateAdTag(editingRow.ad_id, editingRow.chain, editingRow.state);
      setEditingRow(null);
    }
  };

  const handleCancel = () => {
    setEditingRow(null);
  };

  if (loading) return <div>Loading ads data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ads Performance Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Name</TableHead>
              <TableHead>Spend</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Chain</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Monthly Sales</TableHead>
              <TableHead>Cost per Case</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.map((row) => (
              <TableRow key={row.ad_id}>
                <TableCell className="font-medium">{row.ad_name}</TableCell>
                <TableCell>${row.spend.toFixed(2)}</TableCell>
                <TableCell>{row.delivery}</TableCell>
                <TableCell>
                  {editingRow?.ad_id === row.ad_id ? (
                    <Input
                      value={editingRow.chain}
                      onChange={(e) => setEditingRow({...editingRow, chain: e.target.value})}
                      className="w-24"
                    />
                  ) : (
                    row.chain || "-"
                  )}
                </TableCell>
                <TableCell>
                  {editingRow?.ad_id === row.ad_id ? (
                    <Input
                      value={editingRow.state}
                      onChange={(e) => setEditingRow({...editingRow, state: e.target.value})}
                      className="w-20"
                    />
                  ) : (
                    row.state || "-"
                  )}
                </TableCell>
                <TableCell>{row.monthly_sales?.toFixed(0) || "-"}</TableCell>
                <TableCell>
                  {row.cost_per_case ? `$${row.cost_per_case.toFixed(2)}` : "-"}
                </TableCell>
                <TableCell>
                  {editingRow?.ad_id === row.ad_id ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave}>
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};