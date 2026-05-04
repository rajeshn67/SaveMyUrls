import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  Check,
  Folder,
  Globe2,
  Layers3,
  Link2,
  Lock,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Tags,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import AuthModal from '../components/AuthModal';

const features = [
  {
    title: 'Save every useful link',
    description: 'Store articles, tools, videos, docs, references, and research links in one searchable library.',
    icon: Link2,
  },
  {
    title: 'Organize by category',
    description: 'Group bookmarks into focused collections so your best resources are easy to scan later.',
    icon: Folder,
  },
  {
    title: 'Private Vault mode',
    description: 'Hide sensitive URLs behind a vault password with secure hashed password storage.',
    icon: Lock,
  },
  {
    title: 'Insights and analytics',
    description: 'Track saved links, top domains, favorite coverage, categories, and recent saving activity.',
    icon: BarChart3,
  },
];

const seoBenefits = [
  'JWT protected account access',
  'Private links hidden from the normal dashboard',
  'Fast search across title, URL, domain, tag, and category',
  'Favorites, pinned links, categories, and vault storage',
];

const useCases = [
  'Research libraries',
  'Developer resources',
  'Design inspiration',
  'Course bookmarks',
  'Client references',
  'Personal reading lists',
];

const proofStats = [
  ['12k+', 'links organized across focused libraries'],
  ['30 sec', 'average time to save and categorize a useful URL'],
  ['100%', 'private vault links hidden from the normal dashboard'],
];

const steps = [
  {
    title: 'Save the link',
    description: 'Add a URL with a title, category, tags, and optional notes so context is not lost.',
    icon: Zap,
  },
  {
    title: 'Organize the library',
    description: 'Use categories, favorites, pinned links, search, and filters to keep important resources close.',
    icon: Workflow,
  },
  {
    title: 'Protect and review',
    description: 'Move sensitive links into Private Vault and use analytics to understand what you save most.',
    icon: ShieldCheck,
  },
];

const audienceCards = [
  {
    title: 'Students and researchers',
    description: 'Keep academic references, papers, tutorials, and reading lists organized by topic.',
    icon: Bookmark,
  },
  {
    title: 'Developers and builders',
    description: 'Save documentation, Stack Overflow answers, GitHub repositories, tools, and API references.',
    icon: Layers3,
  },
  {
    title: 'Teams and operators',
    description: 'Track useful client links, internal resources, inspiration, dashboards, and competitor research.',
    icon: Users,
  },
];

const testimonials = [
  {
    quote: 'SaveMyURLs feels like the missing layer between browser bookmarks and a full knowledge base.',
    name: 'Aarav Mehta',
    role: 'Product Designer',
  },
  {
    quote: 'The vault is exactly what I needed for private client URLs that should not sit beside normal bookmarks.',
    name: 'Priya Shah',
    role: 'Freelance Developer',
  },
  {
    quote: 'Analytics helped me see which domains and categories I actually rely on every week.',
    name: 'Neel Verma',
    role: 'Research Lead',
  },
];

const comparisonRows = [
  ['Search by title, domain, tag, and category', true, false],
  ['Private password-protected vault', true, false],
  ['Category analytics and domain insights', true, false],
  ['Favorites, pinned links, and focused dashboard', true, true],
];

export default function Landing() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    document.title = 'SaveMyURLs | Secure Bookmark Manager and Private Link Vault';

    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    setMeta(
      'description',
      'SaveMyURLs is a secure bookmark manager for saving, organizing, searching, analyzing, and protecting important links with Private Vault mode.'
    );
    setMeta(
      'keywords',
      'bookmark manager, save links, URL manager, private links, link vault, organize bookmarks, SaveMyURLs'
    );
  }, []);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f6f7fc] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f6f7fc]/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between px-5">
          <a href="#top" className="flex items-center gap-2.5" aria-label="SaveMyURLs home">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#156fe6] text-white shadow-md shadow-blue-500/20">
              <Bookmark className="h-5 w-5" strokeWidth={2.5} />
              <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-lg bg-white shadow-sm">
                <Link2 className="h-2.5 w-2.5 text-[#156fe6]" strokeWidth={2.5} />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0f5cc2]">
              SaveMyURLs
            </span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex" aria-label="Main navigation">
            <a href="#features" className="hover:text-[#156fe6]">Features</a>
            <a href="#how-it-works" className="hover:text-[#156fe6]">Workflow</a>
            <a href="#vault" className="hover:text-[#156fe6]">Private Vault</a>
            <a href="#analytics" className="hover:text-[#156fe6]">Analytics</a>
            <a href="#pricing" className="hover:text-[#156fe6]">Pricing</a>
            <a href="#faq" className="hover:text-[#156fe6]">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white md:inline-flex"
            >
              Sign In
            </button>
            <Button
              type="button"
              onClick={() => openAuth('register')}
              className="h-10 rounded-xl bg-[#156fe6] px-5 text-sm font-semibold hover:bg-[#0f64d8]"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[#f6f7fc]" />
          <div className="relative mx-auto grid w-full max-w-[1180px] gap-10 px-5 pb-12 pt-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(480px,1.05fr)] lg:items-center lg:pt-10">
            <div className="max-w-[620px]">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#f8fbff] px-3 py-1 text-sm font-medium text-[#156fe6]">
                <ShieldCheck className="h-4 w-4" />
                Secure bookmark manager with Private Vault mode
              </p>
              <h1 className="text-5xl font-semibold leading-tight tracking-tight text-slate-950 md:text-6xl">
                Save, organize, and protect every important link.
              </h1>
              <p className="mt-5 max-w-[560px] text-lg leading-8 text-slate-600">
                SaveMyURLs helps you turn scattered bookmarks into a searchable, categorized link library with favorites, analytics, and password-protected private links.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={() => openAuth('register')}
                  className="h-12 rounded-xl bg-[#156fe6] px-6 text-base font-semibold hover:bg-[#0f64d8]"
                >
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openAuth('login')}
                  className="h-12 rounded-xl border-slate-200 bg-white px-6 text-base"
                >
                  Sign In
                </Button>
              </div>

              <div className="mt-7 grid max-w-[560px] gap-2 sm:grid-cols-2">
                {seoBenefits.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 flex-shrink-0 text-[#156fe6]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-8 hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg lg:block">
                1,248 links organized
              </div>
              <div className="absolute -right-3 bottom-10 hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg lg:block">
                Vault locked
              </div>
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-[#f7f9ff] shadow-[0_24px_70px_rgba(15,35,75,0.16)]">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex w-[230px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    <Search className="h-3.5 w-3.5" />
                    Search by title, domain, tag...
                  </div>
                </div>

                <div className="grid gap-4 p-4 md:grid-cols-[150px_minmax(0,1fr)]">
                  <aside className="hidden rounded-2xl border border-slate-200 bg-white p-3 md:block">
                    {['Dashboard', 'Analytics', 'Favorites', 'Categories', 'Private Vault'].map((item, index) => (
                      <div
                        key={item}
                        className={`mb-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                          index === 0 ? 'bg-[#edf3ff] text-[#156fe6]' : 'text-slate-500'
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </aside>
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        ['Links', '428'],
                        ['Favorites', '86'],
                        ['Vault', '24'],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <p className="text-xs font-medium text-slate-500">{label}</p>
                          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ['React Documentation', 'react.dev', 'Development'],
                        ['Design Systems Guide', 'figma.com', 'Design'],
                        ['Market Research Notes', 'notion.so', 'Research'],
                        ['Private Client Portal', 'hidden url', 'Vault'],
                      ].map(([title, domain, category], index) => (
                        <div key={title} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#edf3ff] text-[#156fe6]">
                              {index === 3 ? <Lock className="h-4 w-4" /> : <Globe2 className="h-4 w-4" />}
                            </div>
                            <Star className={`h-4 w-4 ${index === 0 ? 'fill-[#f3bf42] text-[#f3bf42]' : 'text-slate-300'}`} />
                          </div>
                          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">{domain}</p>
                          <p className="mt-3 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                            {category}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-[#f6f7fc]">
          <div className="mx-auto grid w-full max-w-[1180px] gap-4 px-5 py-10 md:grid-cols-3">
            {proofStats.map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-[1180px] px-5 py-16">
          <div className="max-w-[720px]">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#156fe6]">Features</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
              Everything you need to manage links professionally.
            </h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">
              SaveMyURLs is built for people who collect useful web resources and need to find them again quickly.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3ff] text-[#156fe6]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-950">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="border-y border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-[1180px] px-5 py-16">
            <div className="mx-auto max-w-[760px] text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#156fe6]">Workflow</p>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
                From scattered tabs to a useful web library.
              </h2>
              <p className="mt-3 text-lg leading-8 text-slate-600">
                SaveMyURLs keeps the core workflow simple, then adds power where your saved links need it.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="relative rounded-3xl border border-slate-200 bg-[#f8fbff] p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#156fe6] text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-semibold text-slate-400">0{index + 1}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-950">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1180px] px-5 py-16">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#156fe6]">Built For</p>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
                A focused link manager for every kind of web research.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Whether you collect references for study, client work, product research, or personal projects, SaveMyURLs keeps your links structured and easy to revisit.
              </p>
            </div>
            <div className="grid gap-4">
              {audienceCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article key={card.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#edf3ff] text-[#156fe6]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">{card.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{card.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="vault" className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid w-full max-w-[1180px] gap-8 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#156fe6]">Private Vault</p>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
                Keep sensitive links out of your main dashboard.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Private Vault mode lets users save hidden links behind a password-protected section. Vault URLs are excluded from the regular dashboard and analytics only shows private counts.
              </p>
              <div className="mt-6 space-y-3">
                {['Vault password is never returned to the frontend', 'Secret links stay hidden from normal link views', 'Show and hide private URLs only after unlocking'].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-slate-700">
                    <ShieldCheck className="h-4 w-4 text-[#156fe6]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-[#f7f9ff] p-5 shadow-sm">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Private Vault</p>
                    <p className="text-sm text-slate-500">Enter Vault Password</p>
                  </div>
                  <Lock className="h-5 w-5 text-[#156fe6]" />
                </div>
                <div className="h-12 rounded-xl border border-slate-200 bg-slate-50" />
                <div className="mt-4 h-11 rounded-xl bg-[#156fe6]" />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">Private Link</p>
                    <p className="mt-2 text-sm text-slate-400">****************</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">Secure Portal</p>
                    <p className="mt-2 text-sm text-slate-400">****************</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="analytics" className="mx-auto grid w-full max-w-[1180px] gap-8 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-[#edf3ff] p-3">
                <p className="text-sm text-slate-600">Links</p>
                <p className="text-2xl font-semibold">428</p>
              </div>
              <div className="rounded-2xl bg-[#ecfdf5] p-3">
                <p className="text-sm text-slate-600">Vault</p>
                <p className="text-2xl font-semibold">24</p>
              </div>
              <div className="rounded-2xl bg-[#fff7ed] p-3">
                <p className="text-sm text-slate-600">Domains</p>
                <p className="text-2xl font-semibold">91</p>
              </div>
            </div>
            <div className="flex h-44 items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              {[48, 72, 42, 88, 58, 96, 70, 84, 62, 100, 78, 90].map((height, index) => (
                <div key={index} className="flex flex-1 items-end">
                  <div className="w-full rounded-t-lg bg-[#156fe6]" style={{ height: `${height}%` }} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#156fe6]">Analytics</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
              Understand what you save and how your library grows.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Built-in analytics show saving activity, top domains, top categories, recent additions, favorites, pins, and private vault usage.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {useCases.map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid w-full max-w-[1180px] gap-5 px-5 py-12 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <Search className="mt-1 h-5 w-5 text-[#156fe6]" />
              <div>
                <h3 className="font-semibold text-slate-950">Search faster</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">Find links by title, URL, domain, tag, category, or description.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Tags className="mt-1 h-5 w-5 text-[#156fe6]" />
              <div>
                <h3 className="font-semibold text-slate-950">Organize clearly</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">Use categories, favorites, and pinned links to keep important resources close.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 text-[#156fe6]" />
              <div>
                <h3 className="font-semibold text-slate-950">Work with focus</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">A clean dashboard keeps saved resources readable and ready for repeated use.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-[1180px] px-5 py-16">
            <div className="max-w-[760px]">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#156fe6]">Why It Is Better</p>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
                More useful than browser bookmarks, lighter than a knowledge base.
              </h2>
              <p className="mt-3 text-lg leading-8 text-slate-600">
                SaveMyURLs is designed around link workflows: capture quickly, retrieve fast, protect sensitive URLs, and understand your saved resources.
              </p>
            </div>

            <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] border-b border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700">
                <span>Capability</span>
                <span>SaveMyURLs</span>
                <span>Browser bookmarks</span>
              </div>
              {comparisonRows.map(([label, hasApp, hasBrowser]) => (
                <div key={String(label)} className="grid grid-cols-[1.4fr_0.8fr_0.8fr] border-b border-slate-100 px-5 py-4 text-sm text-slate-600 last:border-b-0">
                  <span>{label}</span>
                  <span>{hasApp ? <Check className="h-5 w-5 text-[#156fe6]" /> : '-'}</span>
                  <span>{hasBrowser ? <Check className="h-5 w-5 text-slate-400" /> : '-'}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1180px] px-5 py-16">
          <div className="mx-auto max-w-[760px] text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#156fe6]">What Users Say</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
              Built for people who save the web with intention.
            </h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <Quote className="mb-5 h-7 w-7 text-[#156fe6]" />
                <p className="text-base leading-7 text-slate-700">{testimonial.quote}</p>
                <div className="mt-6">
                  <p className="font-semibold text-slate-950">{testimonial.name}</p>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid w-full max-w-[1180px] gap-8 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#156fe6]">Pricing</p>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
                Start free. Organize your links today.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                The current SaveMyURLs experience gives users the core link manager, categories, favorites, analytics, and Private Vault workflow from the start.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-[#f8fbff] p-6 shadow-sm">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-950">Free Workspace</h3>
                    <p className="mt-1 text-sm text-slate-500">For personal link libraries and secure URL storage.</p>
                  </div>
                  <p className="text-4xl font-semibold text-slate-950">$0</p>
                </div>
                <div className="mt-6 grid gap-3">
                  {['Unlimited dashboard access', 'Categories, favorites, and pinned links', 'Private Vault mode', 'Analytics dashboard'].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-slate-700">
                      <Check className="h-4 w-4 text-[#156fe6]" />
                      {item}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  onClick={() => openAuth('register')}
                  className="mt-7 h-12 w-full rounded-xl bg-[#156fe6] text-base font-semibold hover:bg-[#0f64d8]"
                >
                  Create Free Account
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto w-full max-w-[900px] px-5 py-16">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#156fe6]">FAQ</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">Questions before you start?</h2>
          </div>
          <div className="mt-8 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white px-5 shadow-sm">
            {[
              ['What is SaveMyURLs?', 'SaveMyURLs is a secure URL and bookmark manager for saving, organizing, searching, and analyzing useful web links.'],
              ['Are private links visible in the dashboard?', 'No. Private Vault links are excluded from normal dashboard views and require a vault password to access.'],
              ['Can I organize links by category?', 'Yes. You can create categories, rename them, search within them, and use favorites or pinned links for priority resources.'],
              ['Does analytics show my private URLs?', 'No. Analytics only includes a private vault count and does not reveal secret link titles or URLs.'],
              ['Can I use SaveMyURLs without refreshing between accounts?', 'Yes. The app clears user-specific link and vault state on logout, login, registration, and expired sessions.'],
            ].map(([question, answer]) => (
              <div key={question} className="py-5">
                <h3 className="text-lg font-semibold text-slate-950">{question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1180px] px-5 pb-16">
          <div className="rounded-3xl bg-[#156fe6] px-6 py-12 text-center text-white md:px-10">
            <h2 className="text-4xl font-semibold tracking-tight">Ready to organize your web?</h2>
            <p className="mx-auto mt-3 max-w-[620px] text-base leading-7 text-blue-100">
              Create your SaveMyURLs account and build a searchable, secure link library in minutes.
            </p>
            <Button
              type="button"
              onClick={() => openAuth('register')}
              className="mt-7 h-12 rounded-xl bg-white px-7 text-base font-semibold text-[#156fe6] hover:bg-slate-100"
            >
              Create Free Account
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5 px-5 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#156fe6] text-white">
              <Bookmark className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-semibold text-slate-800">SaveMyURLs</p>
              <p className="text-xs">Copyright 2026 SaveMyURLs. All rights reserved.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <a href="#features" className="hover:text-[#156fe6]">Features</a>
            <a href="#how-it-works" className="hover:text-[#156fe6]">Workflow</a>
            <a href="#vault" className="hover:text-[#156fe6]">Private Vault</a>
            <a href="#analytics" className="hover:text-[#156fe6]">Analytics</a>
            <a href="#pricing" className="hover:text-[#156fe6]">Pricing</a>
            <a href="#faq" className="hover:text-[#156fe6]">FAQ</a>
          </div>
        </div>
      </footer>

      <AuthModal
        open={authOpen}
        initialMode={authMode}
        onOpenChange={(openState) => setAuthOpen(openState)}
      />
    </div>
  );
}
