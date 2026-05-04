import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  Bookmark,
  Clock3,
  Folder,
  Globe2,
  Link2,
  Lock,
  Pin,
  RefreshCw,
  Star,
  TrendingUp,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { urlsAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '../components/ui/chart';
import type { ChartConfig } from '../components/ui/chart';

interface AnalyticsData {
  totals: {
    totalLinks: number;
    publicLinks: number;
    secretLinks: number;
    favoriteLinks: number;
    pinnedLinks: number;
    categoryCount: number;
    domainCount: number;
  };
  categoryBreakdown: Array<{ name: string; count: number }>;
  domainBreakdown: Array<{ domain: string; count: number }>;
  activity: Array<{ date: string; label: string; count: number }>;
  recentLinks: Array<{
    _id: string;
    title: string;
    url: string;
    category: string;
    domain: string;
    createdAt: string;
    isFavorite: boolean;
    isPinned: boolean;
    thumbnail?: string;
  }>;
}

const chartColors = ['#156fe6', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#0f766e', '#64748b', '#db2777'];

const activityConfig = {
  count: {
    label: 'Links saved',
    color: '#156fe6',
  },
} satisfies ChartConfig;

const categoryConfig = {
  count: {
    label: 'Links',
    color: '#156fe6',
  },
  Visible: {
    label: 'Visible',
    color: '#156fe6',
  },
  Private: {
    label: 'Private',
    color: '#14b8a6',
  },
  Favorites: {
    label: 'Favorites',
    color: '#f59e0b',
  },
  Pinned: {
    label: 'Pinned',
    color: '#ef4444',
  },
} satisfies ChartConfig;

let cachedAnalytics: AnalyticsData | null = null;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await urlsAPI.getAnalytics();
      cachedAnalytics = response.data;
      setAnalytics(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (cachedAnalytics) {
      setAnalytics(cachedAnalytics);
      setIsLoading(false);
      return;
    }

    fetchAnalytics();
  }, []);

  const weeklySaves = useMemo(() => {
    if (!analytics) return 0;
    return analytics.activity.slice(-7).reduce((sum, item) => sum + item.count, 0);
  }, [analytics]);

  const previousWeeklySaves = useMemo(() => {
    if (!analytics) return 0;
    return analytics.activity.slice(-14, -7).reduce((sum, item) => sum + item.count, 0);
  }, [analytics]);

  const weeklyTrend = weeklySaves - previousWeeklySaves;
  const favoriteRate = analytics?.totals.publicLinks
    ? Math.round((analytics.totals.favoriteLinks / analytics.totals.publicLinks) * 100)
    : 0;
  const vaultShare = analytics?.totals.totalLinks
    ? Math.round((analytics.totals.secretLinks / analytics.totals.totalLinks) * 100)
    : 0;
  const topCategory = analytics?.categoryBreakdown[0];
  const topDomain = analytics?.domainBreakdown[0];

  const summaryCards = analytics
    ? [
        {
          label: 'Total Links',
          value: analytics.totals.totalLinks,
          detail: `${analytics.totals.publicLinks} visible, ${analytics.totals.secretLinks} private`,
          icon: Link2,
        },
        {
          label: 'Favorites',
          value: analytics.totals.favoriteLinks,
          detail: `${favoriteRate}% of visible library`,
          icon: Star,
        },
        {
          label: 'Categories',
          value: analytics.totals.categoryCount,
          detail: topCategory ? `Top: ${topCategory.name}` : 'No categories yet',
          icon: Folder,
        },
        {
          label: 'Private Vault',
          value: analytics.totals.secretLinks,
          detail: `${vaultShare}% of all saved links`,
          icon: Lock,
        },
      ]
    : [];

  return (
    <AppShell
      title="Analytics"
      subtitle="A clear read on how your saved library is growing and organized."
      showSearch={false}
    >
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-500">
          Track visible links, vault usage, categories, domains, and saving momentum.
        </p>
        <Button variant="outline" onClick={fetchAnalytics} disabled={isLoading} className="h-10 rounded-xl">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500">
          Loading analytics...
        </div>
      ) : analytics ? (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf3ff] text-[#156fe6]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-600">
                      Live
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="mt-1 text-3xl font-semibold text-slate-900">{card.value}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{card.detail}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Saving Activity</h2>
                  <p className="mt-1 text-sm text-slate-500">New visible links saved over the last 30 days.</p>
                </div>
                <Badge className="rounded-full bg-[#edf3ff] text-[#156fe6] hover:bg-[#edf3ff]">
                  <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                  {weeklyTrend >= 0 ? '+' : ''}
                  {weeklyTrend} this week
                </Badge>
              </div>
              <ChartContainer config={activityConfig} className="h-[190px] w-full">
                <AreaChart data={analytics.activity} margin={{ left: 0, right: 8, top: 10 }}>
                  <defs>
                    <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#156fe6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#156fe6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={18} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#156fe6"
                    strokeWidth={2}
                    fill="url(#activityFill)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Library Mix</h2>
              <p className="mt-1 text-sm text-slate-500">Visible, private, favorite, and pinned coverage.</p>
              <div className="mt-3 h-[190px]">
                <ChartContainer config={categoryConfig} className="h-full w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={[
                        { name: 'Visible', count: analytics.totals.publicLinks },
                        { name: 'Private', count: analytics.totals.secretLinks },
                        { name: 'Favorites', count: analytics.totals.favoriteLinks },
                        { name: 'Pinned', count: analytics.totals.pinnedLinks },
                      ].filter((item) => item.count > 0)}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={42}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {chartColors.map((color) => (
                        <Cell key={color} fill={color} />
                      ))}
                    </Pie>
                    <Legend content={<ChartLegendContent nameKey="name" />} />
                  </PieChart>
                </ChartContainer>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Top Categories</h2>
                  <p className="mt-1 text-sm text-slate-500">Where your visible links are concentrated.</p>
                </div>
                <Folder className="h-5 w-5 text-slate-400" />
              </div>
              {analytics.categoryBreakdown.length === 0 ? (
                <p className="text-sm text-slate-500">No category data yet.</p>
              ) : (
                <ChartContainer config={categoryConfig} className="h-[190px] w-full">
                  <BarChart data={analytics.categoryBreakdown} layout="vertical" margin={{ left: 8, right: 32 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={108}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                      {analytics.categoryBreakdown.map((_, index) => (
                        <Cell key={index} fill={chartColors[index % chartColors.length]} />
                      ))}
                      <LabelList dataKey="count" position="right" className="fill-slate-700" fontSize={12} />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Top Domains</h2>
                  <p className="mt-1 text-sm text-slate-500">The sites you save most often.</p>
                </div>
                <Globe2 className="h-5 w-5 text-slate-400" />
              </div>
              <div className="space-y-2">
                {analytics.domainBreakdown.length === 0 ? (
                  <p className="text-sm text-slate-500">No domain data yet.</p>
                ) : (
                  analytics.domainBreakdown.map((item, index) => {
                    const percent = analytics.totals.publicLinks
                      ? Math.round((item.count / analytics.totals.publicLinks) * 100)
                      : 0;
                    return (
                      <div key={item.domain} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{item.domain}</p>
                            <p className="text-xs text-slate-500">{item.count} saved links</p>
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{percent}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: chartColors[index % chartColors.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Recent Saves</h2>
                  <p className="mt-1 text-sm text-slate-500">Latest visible links added to your library.</p>
                </div>
                <Clock3 className="h-5 w-5 text-slate-400" />
              </div>
              <div className="divide-y divide-slate-100">
                {analytics.recentLinks.length === 0 ? (
                  <p className="py-4 text-sm text-slate-500">No recent links yet.</p>
                ) : (
                  analytics.recentLinks.map((link) => (
                    <a
                      key={link._id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 py-2.5 transition hover:bg-slate-50"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#edf3ff] text-[#156fe6]">
                        {link.thumbnail ? (
                          <img src={link.thumbnail} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{link.title}</p>
                        <p className="truncate text-xs text-slate-500">
                          {link.domain || 'unknown'} • {formatDate(link.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {link.isFavorite ? <Star className="h-4 w-4 fill-[#f3bf42] text-[#f3bf42]" /> : null}
                        {link.isPinned ? <Pin className="h-4 w-4 text-amber-600" /> : null}
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#156fe6]" />
                <h2 className="text-xl font-semibold text-slate-900">Library Health</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-500">Favorite coverage</span>
                    <span className="font-semibold text-slate-900">{favoriteRate}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-[#156fe6]" style={{ width: `${favoriteRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-500">Vault share</span>
                    <span className="font-semibold text-slate-900">{vaultShare}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-[#14b8a6]" style={{ width: `${vaultShare}%` }} />
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">Best signal</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {topDomain
                      ? `${topDomain.domain} is your most saved domain with ${topDomain.count} links.`
                      : 'Save more links to unlock richer insights.'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">This week</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    You saved {weeklySaves} visible link{weeklySaves === 1 ? '' : 's'} in the last 7 days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
