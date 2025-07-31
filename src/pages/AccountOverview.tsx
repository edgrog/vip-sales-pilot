import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Phone, Mail, Calendar, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/integrations/supabase/client";

interface AccountData {
  name: string;
  address: string;
  city: string;
  state: string;
  normalized_chain: string;
  may_2025: number;
  june_2025: number;
  july_2025: number;
}

interface AccountMetrics {
  currentWeekly: number;
  previousWeekly: number;
  growth: number;
  status: 'growing' | 'declining' | 'stable';
  totalCases: number;
}

const AccountOverview = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [metrics, setMetrics] = useState<AccountMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accountId) {
      fetchAccountData();
    }
  }, [accountId]);

  const fetchAccountData = async () => {
    try {
      setLoading(true);
      
      // Decode the account ID from URL encoding
      const decodedAccountId = decodeURIComponent(accountId || '');
      
      const { data, error } = await supabase
        .from('vip_sales')
        .select('*')
        .eq('Retail Accounts', decodedAccountId)
        .single();

      if (error) {
        console.error('Error fetching account data:', error);
        return;
      }

      if (data) {
        const account: AccountData = {
          name: data["Retail Accounts"] || '',
          address: data["Address"] || '',
          city: data["City"] || '',
          state: data["State"] || '',
          normalized_chain: data["normalized_chain"] || '',
          may_2025: data["May 2025"] || 0,
          june_2025: data["June 2025"] || 0,
          july_2025: data["July 2025"] || 0,
        };

        setAccountData(account);

        // Calculate metrics
        const growth = account.june_2025 > 0 
          ? ((account.july_2025 - account.june_2025) / account.june_2025) * 100 
          : 0;

        const totalCases = account.may_2025 + account.june_2025 + account.july_2025;

        const accountMetrics: AccountMetrics = {
          currentWeekly: account.july_2025,
          previousWeekly: account.june_2025,
          growth,
          status: growth > 5 ? 'growing' : growth < -5 ? 'declining' : 'stable',
          totalCases
        };

        setMetrics(accountMetrics);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = accountData ? [
    { month: 'May 2025', cases: accountData.may_2025 },
    { month: 'June 2025', cases: accountData.june_2025 },
    { month: 'July 2025', cases: accountData.july_2025 },
  ] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'growing': return 'bg-success text-success-foreground';
      case 'declining': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-8 w-64" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-32" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!accountData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-6 py-8">
          <Header 
            showBackButton={true}
            backButtonText="Back to Dashboard"
            backButtonPath="/"
          />
          
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Account Not Found</h2>
            <p className="text-muted-foreground">The account you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-6 py-8">
        <Header 
          title={accountData.name}
          subtitle={accountData.normalized_chain}
          showBackButton={true}
          backButtonText="Back to Dashboard"
          backButtonPath="/"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance (Last 3 Months)</CardTitle>
                <CardDescription>Cases sold per week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value} cases/week`, 'Sales']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cases" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Current Weekly</p>
                      <p className="text-2xl font-bold">{metrics?.currentWeekly.toFixed(1)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    {metrics && metrics.growth >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Growth Rate</p>
                      <p className={`text-2xl font-bold ${
                        metrics && metrics.growth >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {metrics?.growth >= 0 ? '+' : ''}{metrics?.growth.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cases (3 months)</p>
                    <p className="text-2xl font-bold">{metrics?.totalCases.toFixed(1)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tasks/Notes Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Store visits and notes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent activity recorded</p>
                  <p className="text-sm text-muted-foreground mt-2">Visit history and notes will appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={getStatusColor(metrics?.status || 'stable')}>
                  {metrics?.status || 'stable'}
                </Badge>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Store Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {accountData.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{accountData.address}</p>
                      <p className="text-sm">{accountData.city}, {accountData.state}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium text-muted-foreground">Not available</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-muted-foreground">Not available</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chain Information */}
            {accountData.normalized_chain && (
              <Card>
                <CardHeader>
                  <CardTitle>Chain Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{accountData.normalized_chain}</p>
                  <p className="text-sm text-muted-foreground mt-1">Chain Network</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountOverview;