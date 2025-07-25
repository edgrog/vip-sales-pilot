import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface VipSalesData {
  "Retail Accounts": string;
  "State": string;
  "May 2025": number;
  "June 2025": number;
  "July 2025": number;
  status?: string;
}

interface Props {
  dashboardData: {
    accountPerformance: Array<{
      name: string;
      state: string;
      mayCases: number;
      juneCases: number;
      julyCases: number;
      status: string;
    }>;
  };
  onBack: () => void;
}

export function GrowingAccountsGraph({ dashboardData, onBack }: Props) {
  const getGrowingStores = () => {
    return dashboardData.accountPerformance.filter(account => 
      account.juneCases > 0 && 
      account.julyCases > account.juneCases && 
      ((account.julyCases - account.juneCases) / account.juneCases) >= 0.1
    );
  };

  const getMayGrowingAccounts = () => {
    return dashboardData.accountPerformance.filter(account => 
      account.mayCases > 0 && account.juneCases > account.mayCases && 
      ((account.juneCases - account.mayCases) / account.mayCases) >= 0.1
    ).length;
  };

  const getJuneGrowingAccounts = () => {
    return dashboardData.accountPerformance.filter(account => 
      account.juneCases > 0 && account.julyCases > account.juneCases && 
      ((account.julyCases - account.juneCases) / account.juneCases) >= 0.1
    ).length;
  };

  return (
    <Card className="card-grog">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Growing Accounts
            </Button>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Growing Accounts - Monthly Breakdown</CardTitle>
        <CardDescription>Month-by-month analysis of accounts showing growth</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Monthly Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-success/20 bg-success/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">May 2025</CardTitle>
              <CardDescription>Growing Accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {getMayGrowingAccounts()}
              </div>
            </CardContent>
          </Card>
          <Card className="border-success/20 bg-success/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">June 2025</CardTitle>
              <CardDescription>Growing Accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {getJuneGrowingAccounts()}
              </div>
            </CardContent>
          </Card>
          <Card className="border-success/20 bg-success/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">July 2025</CardTitle>
              <CardDescription>Growing Accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {getGrowingStores().length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Growing Accounts Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                growingAccounts: {
                  label: "Growing Accounts",
                  color: "hsl(var(--success))",
                },
              }}
              className="h-[300px]"
            >
              <BarChart
                data={[
                  {
                    month: "May 2025",
                    growingAccounts: getMayGrowingAccounts(),
                  },
                  {
                    month: "June 2025",
                    growingAccounts: getJuneGrowingAccounts(),
                  },
                  {
                    month: "July 2025",
                    growingAccounts: getGrowingStores().length,
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="growingAccounts" fill="var(--color-growingAccounts)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Growth Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Changes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">June vs May:</span>
                <span className="font-medium text-success">
                  {(() => {
                    const mayGrowing = getMayGrowingAccounts();
                    const juneGrowing = getJuneGrowingAccounts();
                    const change = mayGrowing > 0 ? ((juneGrowing - mayGrowing) / mayGrowing * 100) : 0;
                    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">July vs June:</span>
                <span className="font-medium text-success">
                  {(() => {
                    const juneGrowing = getJuneGrowingAccounts();
                    const julyGrowing = getGrowingStores().length;
                    const change = juneGrowing > 0 ? ((julyGrowing - juneGrowing) / juneGrowing * 100) : 0;
                    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
                  })()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Key Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">Current Month (July):</span>
                <span className="font-medium">{getGrowingStores().length} accounts</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">Peak Month:</span>
                <span className="font-medium">
                  {(() => {
                    const mayGrowing = getMayGrowingAccounts();
                    const juneGrowing = getJuneGrowingAccounts();
                    const julyGrowing = getGrowingStores().length;
                    const max = Math.max(mayGrowing, juneGrowing, julyGrowing);
                    if (max === julyGrowing) return "July";
                    if (max === juneGrowing) return "June";
                    return "May";
                  })()} 2025
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">Growth Threshold:</span>
                <span className="font-medium">≥10% increase</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}