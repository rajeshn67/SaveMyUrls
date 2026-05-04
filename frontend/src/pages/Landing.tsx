import { useState } from 'react';
import { Button } from '../components/ui/button';
import AuthModal from '../components/AuthModal';
import { ArrowRight, Link2, Sparkles, RefreshCcw, Search, Share2, Bookmark } from 'lucide-react';

const featureCards = [
  {
    title: 'One-Click Save',
    description:
      'Instantly capture any webpage with our browser extension. Metadata and favicons are automatically pulled.',
    icon: Link2,
  },
  {
    title: 'AI Organization',
    description:
      'Our smart engine categorizes your links into folders and tags automatically based on content analysis.',
    icon: Sparkles,
  },
  {
    title: 'Universal Sync',
    description:
      'Access your collection from your phone, tablet, or desktop. Your links are always ready when you are.',
    icon: RefreshCcw,
  },
];

export default function Landing() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-[#f5f6fb] text-slate-900">
      <header className="mx-auto flex h-[74px] w-full max-w-[1280px] items-center justify-between border-b border-slate-200/70 px-5">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#156fe6] to-[#0f5cc2] text-white shadow-lg shadow-blue-500/30">
              <Bookmark className="h-5 w-5" strokeWidth={2.5} />
              <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-lg bg-white shadow-md">
                <Link2 className="h-2.5 w-2.5 text-[#156fe6]" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-[26px] font-bold tracking-tight text-[#0f5cc2]">
              <span className="text-[#156fe6]">Save</span>My<span className="text-[#156fe6]">URLs</span>
            </p>
          </div>
          <nav className="flex items-center gap-7 text-[14px] text-slate-500">
            <button className="font-semibold text-slate-900">Features</button>
            <button className="hover:text-slate-800">Pricing</button>
            <button className="hover:text-slate-800">Premium</button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-400 lg:flex">
            <Search className="h-3.5 w-3.5" />
            Search more sec...
          </div>
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setAuthOpen(true);
            }}
            className="text-sm font-medium text-slate-700"
          >
            Sign In
          </button>
          <Button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setAuthOpen(true);
            }}
            className="h-10 rounded-full bg-[#156fe6] px-6 text-sm font-semibold hover:bg-[#0f64d8]"
          >
            Get Started
          </Button>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-8 px-5 py-12 lg:grid-cols-2">
        <div className="max-w-[560px]">
          <p className="mb-6 inline-flex rounded-full border border-slate-200 bg-white px-4 py-1 text-xs text-slate-600">
            Seamless Information Curation
          </p>
          <h1 className="text-[58px] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[66px]">
            Save, Organize, and Access Your Links <span className="text-[#156fe6]">Anywhere</span>
          </h1>
          <p className="mt-5 max-w-[500px] text-[24px] leading-relaxed text-slate-500">
            Simple and minimal. Experience the ultimate digital library that turns your scattered
            bookmarks into a beautifully organized knowledge hub.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="h-12 rounded-xl bg-[#156fe6] px-8 text-sm font-semibold hover:bg-[#0f64d8]">
              Get Started
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="outline" className="h-12 rounded-xl border-slate-200 bg-white px-7 text-sm">
              Continue with Google
            </Button>
          </div>
          <p className="mt-5 text-sm text-slate-500">Join 12,000+ researchers curating their web</p>
        </div>

        <div className="relative h-[430px] rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_45px_rgba(30,53,95,0.15)]">
          <div className="rounded-2xl border border-slate-100 bg-[#f7f9ff] p-4">
            <div className="mb-4 flex gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
            </div>
            <div className="grid grid-cols-[1.3fr_1fr] gap-3">
              <div className="space-y-3">
                <div className="h-[74px] rounded-xl bg-[#1f2531]" />
                <div className="h-[86px] rounded-xl bg-white" />
                <div className="h-[72px] rounded-xl bg-white" />
              </div>
              <div className="space-y-3">
                <div className="h-[34px] rounded-lg bg-white" />
                <div className="h-[84px] rounded-xl bg-white" />
                <div className="h-[52px] rounded-xl bg-[#156fe6]" />
              </div>
            </div>
          </div>
          <div className="absolute -right-3 top-8 rounded-xl bg-white px-3 py-2 text-xs shadow-md">
            Link Saved!
          </div>
          <div className="absolute -bottom-5 left-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
            Import Complete
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 w-full max-w-[1280px] px-5">
        <div className="py-10 text-center">
          <h2 className="mx-auto max-w-[700px] text-5xl font-semibold tracking-[-0.02em]">
            Focus on your research, let us handle the rest.
          </h2>
          <p className="mx-auto mt-4 max-w-[700px] text-lg text-slate-500">
            Powerful tools designed for the modern knowledge worker. Simple enough for everyday use,
            robust enough for professional workflows.
          </p>
          <div className="mt-11 grid grid-cols-1 gap-6 md:grid-cols-3">
            {featureCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-8 text-left">
                  <div className="mb-5 inline-flex rounded-xl bg-[#edf4ff] p-2 text-[#156fe6]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-4xl font-semibold tracking-[-0.02em]">{item.title}</h3>
                  <p className="mt-4 text-base leading-relaxed text-slate-500">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 w-full max-w-[1280px] px-5 pb-12">
        <div className="rounded-[34px] bg-[#156fe6] px-6 py-16 text-center text-white md:px-10">
          <h2 className="text-6xl font-semibold tracking-[-0.02em]">Ready to clear the clutter?</h2>
          <p className="mt-4 text-lg text-blue-100">
            Join thousands of users who have transformed their browsing experience.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button className="h-12 rounded-xl bg-white px-8 text-[#156fe6] hover:bg-slate-100">
              Start Saving Now
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-xl border-blue-200 bg-transparent px-8 text-white hover:bg-blue-600"
            >
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 pb-8 text-sm text-slate-400">
        <div className="flex items-center gap-3">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#156fe6] to-[#0f5cc2] text-white shadow-md shadow-blue-500/20">
            <Bookmark className="h-4 w-4" strokeWidth={2.5} />
            <div className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-md bg-white shadow-sm">
              <Link2 className="h-2 w-2 text-[#156fe6]" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <p className="font-semibold text-slate-700">SaveMyURLs</p>
            <p className="text-xs">© 2024 SaveMyURLs. All rights reserved.</p>
          </div>
        </div>
        <div className="flex items-center gap-7">
          <button>Privacy Policy</button>
          <button>Terms of Service</button>
          <button>Help Center</button>
          <button>Contact</button>
          <Share2 className="h-4 w-4" />
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
