'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Building2, ChevronLeft, ChevronRight, Dumbbell, Sparkles } from 'lucide-react';
import { buttonStyles } from './button';

export interface HeroSlide {
  id: string;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  imageCredit?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}

const FALLBACK: HeroSlide = {
  id: 'fallback',
  eyebrow: 'قدرت از یک تصمیم شروع می‌شود',
  title: 'قهرمان خودت باش',
  subtitle: 'باشگاه مناسب، مربی حرفه‌ای و مسیر پیشرفتت را یک‌جا پیدا کن.',
  imageUrl: '/images/hero/hero-bodybuilder-v1.webp',
  imageCredit: 'تصویر اختصاصی گُردیار',
  ctaLabel: 'شروع به‌عنوان ورزشکار',
  ctaUrl: '/access/athlete',
};

export function PublicHeroSlider({ slides }: { slides: HeroSlide[] }) {
  const items = slides.length ? slides : [FALLBACK];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % items.length), 7000);
    return () => window.clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    if (index >= items.length) setIndex(0);
  }, [index, items.length]);

  const slide = items[index] ?? FALLBACK;
  const move = (step: number) => setIndex((current) => (current + step + items.length) % items.length);

  return (
    <section className="relative mb-7 min-h-[540px] overflow-hidden rounded-[2rem] border border-border/10 bg-surface sm:min-h-[600px]">
      {items.map((item, itemIndex) => (
        <div
          key={item.id}
          aria-hidden={itemIndex !== index}
          className={`absolute inset-0 bg-cover bg-center transition duration-1000 ${itemIndex === index ? 'scale-100 opacity-100' : 'scale-105 opacity-0'}`}
          style={{ backgroundImage: `url("${item.imageUrl}")` }}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,12,18,.18),rgba(7,12,18,.78)_58%,rgba(7,12,18,.95))]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(7,12,18,.82),transparent_50%)]" />

      <div className="relative z-10 flex min-h-[540px] max-w-3xl flex-col justify-center px-6 py-16 text-white sm:min-h-[600px] sm:px-12 lg:px-16">
        {slide.eyebrow && (
          <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-sm font-bold backdrop-blur">
            <Sparkles className="size-4 text-accent-soft" />{slide.eyebrow}
          </p>
        )}
        <h1 className="max-w-2xl text-4xl font-black leading-[1.2] sm:text-6xl lg:text-7xl">{slide.title}</h1>
        {slide.subtitle && <p className="mt-5 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">{slide.subtitle}</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          {slide.ctaLabel && slide.ctaUrl && <Link href={slide.ctaUrl} className={buttonStyles({ size: 'lg' })}>{slide.ctaLabel}</Link>}
          <Link href="/access/athlete" className={buttonStyles({ variant: 'secondary', size: 'lg', className: 'border-white/20 bg-black/30 text-white backdrop-blur hover:bg-black/45' })}><Dumbbell className="size-4" />ورود / ثبت‌نام ورزشکار</Link>
          <Link href="/access/gym-owner" className={buttonStyles({ variant: 'secondary', size: 'lg', className: 'border-white/20 bg-black/30 text-white backdrop-blur hover:bg-black/45' })}><Building2 className="size-4" />ورود / ثبت‌نام مدیر باشگاه</Link>
        </div>
      </div>

      {items.length > 1 && (
        <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
          <button type="button" aria-label="اسلاید قبلی" onClick={() => move(-1)} className="grid size-10 place-items-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur"><ChevronRight className="size-5" /></button>
          <button type="button" aria-label="اسلاید بعدی" onClick={() => move(1)} className="grid size-10 place-items-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur"><ChevronLeft className="size-5" /></button>
        </div>
      )}
      <div className="absolute bottom-6 right-6 z-20 flex gap-1.5">
        {items.map((item, itemIndex) => <button key={item.id} type="button" aria-label={`اسلاید ${itemIndex + 1}`} onClick={() => setIndex(itemIndex)} className={`h-1.5 rounded-full transition-all ${itemIndex === index ? 'w-8 bg-accent' : 'w-2 bg-white/45'}`} />)}
      </div>
      {slide.imageCredit && <span className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 text-[10px] text-white/45">{slide.imageCredit}</span>}
    </section>
  );
}
