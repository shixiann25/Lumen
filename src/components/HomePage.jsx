import { galleryItems } from '../data/gallery'
import { useLang } from '../contexts/LangContext'

export default function HomePage({ setPage }) {
  const { t, lang } = useLang()

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#1A1714] text-white min-h-[92vh] flex items-center">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=1600&q=80)' }}
        />
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-32 w-full">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-10">
              <div className="h-px w-8 bg-[#B8965A]" />
              <span className="text-[#B8965A] text-xs tracking-[0.25em] uppercase font-light">{t('home.eyebrow')}</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[1.05] mb-8 text-white">
              {t('home.hero.line1')}<br />
              <em className="italic text-[#B8965A] not-italic font-semibold">{t('home.hero.line2')}</em><br />
              {t('home.hero.line3')}
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-12 max-w-md font-light">
              {t('home.hero.desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setPage('upload')}
                className="group inline-flex items-center gap-3 bg-[#B8965A] text-white px-8 py-4 rounded-full text-sm font-medium hover:bg-[#A07848] transition-colors"
              >
                <span>{t('home.cta.upload')}</span>
                <span className="text-white/60 group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button
                onClick={() => setPage('gallery')}
                className="inline-flex items-center gap-3 border border-white/20 text-white/80 px-8 py-4 rounded-full text-sm font-medium hover:border-white/40 hover:text-white transition-colors"
              >
                {t('home.cta.gallery')}
              </button>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-white/20" />
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex items-end justify-between mb-14">
          <div>
            <p className="text-[#B8965A] text-xs tracking-[0.2em] uppercase mb-3">{t('home.how.eyebrow')}</p>
            <h2 className="font-display text-3xl font-semibold text-[#1A1714]">{t('home.how.title')}</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#E5DED5]">
          {[
            { num: t('home.how.step1.num'), title: t('home.how.step1.title'), desc: t('home.how.step1.desc') },
            { num: t('home.how.step2.num'), title: t('home.how.step2.title'), desc: t('home.how.step2.desc') },
            { num: t('home.how.step3.num'), title: t('home.how.step3.title'), desc: t('home.how.step3.desc') },
          ].map(({ num, title, desc }) => (
            <div key={num} className="bg-[#F8F6F2] p-8 md:p-10">
              <div className="font-display text-4xl font-semibold text-[#E5DED5] mb-6">{num}</div>
              <h3 className="font-semibold text-[#1A1714] mb-3 text-lg">{title}</h3>
              <p className="text-[#6B6158] text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery preview */}
      <section className="bg-[#1A1714] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[#B8965A] text-xs tracking-[0.2em] uppercase mb-3">{t('home.gallery.eyebrow')}</p>
              <h2 className="font-display text-3xl font-semibold text-white">{t('home.gallery.title')}</h2>
            </div>
            <button
              onClick={() => setPage('gallery')}
              className="text-white/40 hover:text-white text-sm transition-colors"
            >
              {t('home.gallery.all')}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {galleryItems.slice(0, 4).map((item) => (
              <button
                key={item.id}
                onClick={() => setPage('gallery')}
                className="group relative aspect-[3/4] overflow-hidden bg-[#2A2420]"
              >
                <img
                  src={item.thumb}
                  alt={item.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white text-sm font-medium">{item.title}</p>
                  <p className="text-white/50 text-xs mt-0.5">{item.categoryLabel}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Params quick ref */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[#B8965A] text-xs tracking-[0.2em] uppercase mb-3">{t('home.params.eyebrow')}</p>
            <h2 className="font-display text-3xl font-semibold text-[#1A1714]">{t('home.params.title')}</h2>
          </div>
          <button
            onClick={() => setPage('learn')}
            className="text-[#A89C91] hover:text-[#B8965A] text-sm transition-colors"
          >
            {t('home.params.more')}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { param: t('home.params.aperture'), en: t('home.params.aperture.sub'), icon: '◉', tip: t('home.params.aperture.tip'), bg: '#FBF4E8' },
            { param: t('home.params.shutter'), en: t('home.params.shutter.sub'), icon: '◷', tip: t('home.params.shutter.tip'), bg: '#EBF3FA' },
            { param: t('home.params.iso'), en: t('home.params.iso.sub'), icon: '◑', tip: t('home.params.iso.tip'), bg: '#F0EBFA' },
            { param: t('home.params.focal'), en: t('home.params.focal.sub'), icon: '◎', tip: t('home.params.focal.tip'), bg: '#EAFAF0' },
          ].map(({ param, en, icon, tip, bg }) => (
            <div key={param} className="rounded-2xl p-5" style={{ backgroundColor: bg }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl text-[#B8965A]">{icon}</span>
                <div>
                  <p className="font-display font-semibold text-[#1A1714] text-sm">{param}</p>
                  <p className="text-[#A89C91] text-xs">{en}</p>
                </div>
              </div>
              <p className="text-[#6B6158] text-xs leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>

        {/* Learn CTA card */}
        <button
          onClick={() => setPage('learn')}
          className="mt-5 w-full group border border-[#E5DED5] hover:border-[#B8965A] rounded-2xl p-6 flex items-center justify-between transition-colors bg-white"
        >
          <div className="text-left">
            <p className="font-display font-semibold text-[#1A1714] mb-1">{t('home.params.learn.title')}</p>
            <p className="text-[#6B6158] text-sm">{t('home.params.learn.sub')}</p>
          </div>
          <span className="text-[#B8965A] text-xl group-hover:translate-x-1 transition-transform flex-shrink-0 ml-4">→</span>
        </button>
      </section>

      {/* CTA */}
      <section className="bg-[#B8965A] py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl font-semibold text-white mb-4">{t('home.bottom.title')}</h2>
          <p className="text-white/70 mb-8">{t('home.bottom.desc')}</p>
          <button
            onClick={() => setPage('upload')}
            className="bg-white text-[#B8965A] font-semibold px-10 py-4 rounded-full hover:bg-[#F8F6F2] transition-colors"
          >
            {t('home.bottom.cta')}
          </button>
        </div>
      </section>

      <footer className="border-t border-[#E5DED5] text-center py-8 text-[#A89C91] text-xs tracking-wide">
        {t('home.footer')}
      </footer>
    </div>
  )
}
