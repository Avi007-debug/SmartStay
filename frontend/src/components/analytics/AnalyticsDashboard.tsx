import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Eye, MessageSquare, Heart, MousePointer, TrendingUp, Loader2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { API_CONFIG } from '@/lib/api-config';

interface AnalyticsData {
  total_views: number;
  total_inquiries: number;
  total_saves: number;
  total_clicks: number;
  daily_metrics: Array<{
    date: string;
    views: number;
    inquiries: number;
    saves: number;
    clicks: number;
  }>;
  top_performing: Array<{
    pg_id: string;
    pg_name: string;
    views: number;
    inquiries: number;
    saves: number;
  }>;
}

export function AnalyticsDashboard({ ownerId }: { ownerId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    loadAnalytics();
  }, [ownerId, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_CONFIG.BACKEND_URL}/api/analytics/dashboard?owner_id=${ownerId}&days=${timeRange}`
      );
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      } else {
        throw new Error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Failed to load analytics data
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      title: 'Total Views',
      value: data.total_views,
      icon: Eye,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Inquiries',
      value: data.total_inquiries,
      icon: MessageSquare,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Saves',
      value: data.total_saves,
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Clicks',
      value: data.total_clicks,
      icon: MousePointer,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {data.daily_metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.daily_metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Views" />
                <Line type="monotone" dataKey="inquiries" stroke="#10b981" name="Inquiries" />
                <Line type="monotone" dataKey="saves" stroke="#ef4444" name="Saves" />
                <Line type="monotone" dataKey="clicks" stroke="#8b5cf6" name="Clicks" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No data available for the selected period
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top Performing PGs */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Listings</CardTitle>
        </CardHeader>
        <CardContent>
          {data.top_performing.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.top_performing}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="pg_name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="views" fill="#3b82f6" name="Views" />
                <Bar dataKey="inquiries" fill="#10b981" name="Inquiries" />
                <Bar dataKey="saves" fill="#ef4444" name="Saves" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No performance data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Detailed Table */}
      {data.top_performing.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Listing Name</th>
                    <th className="text-right py-3 px-4">Views</th>
                    <th className="text-right py-3 px-4">Inquiries</th>
                    <th className="text-right py-3 px-4">Saves</th>
                    <th className="text-right py-3 px-4">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_performing.map((pg) => (
                    <tr key={pg.pg_id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{pg.pg_name}</td>
                      <td className="text-right py-3 px-4">{pg.views}</td>
                      <td className="text-right py-3 px-4">{pg.inquiries}</td>
                      <td className="text-right py-3 px-4">{pg.saves}</td>
                      <td className="text-right py-3 px-4">
                        {pg.views > 0 ? ((pg.inquiries / pg.views) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
