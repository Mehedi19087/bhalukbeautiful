import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { adsApi, type Ad, type AdSlot as SlotType } from "@/lib/api-client";

type AdCreativeProps = {
  slot: SlotType;
  title: string;
  imageUrl: string;
  className?: string;
};

/**
 * Shared visual used by both public advertisements and the admin preview.
 * Text and artwork deliberately occupy separate regions so they never overlap.
 */
export function AdCreative({ slot, title, imageUrl, className = "" }: AdCreativeProps) {
  if (slot === "SIDEBAR") {
    return (
      <div
        className={`relative mx-auto flex aspect-[300/250] w-full max-w-[300px] flex-col overflow-hidden rounded-lg border border-border bg-white shadow-sm ${className}`}
      >
        <div className="min-h-0 flex-1 overflow-hidden bg-neutral-100">
          <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="flex min-h-[76px] items-center justify-between gap-3 border-t border-border bg-white px-4 py-3">
          <div className="min-w-0">
            <span className="block text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              বিজ্ঞাপন
            </span>
            <strong className="mt-0.5 line-clamp-2 block font-ui text-sm leading-snug text-foreground">
              {title}
            </strong>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (slot === "BANNER_TOP") {
    return (
      <div className={`mx-auto w-full max-w-[970px] ${className}`}>
        <span className="mb-1 block text-center text-[8px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">
          বিজ্ঞাপন
        </span>
        <div className="aspect-[970/90] w-full overflow-hidden bg-neutral-100">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-contain"
            loading="eager"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mx-auto grid h-[88px] w-full max-w-[728px] grid-cols-[104px_minmax(0,1fr)] overflow-hidden rounded-lg border border-border bg-white shadow-sm sm:h-[90px] sm:grid-cols-[180px_minmax(0,1fr)_auto] ${className}`}
    >
      <div className="min-w-0 overflow-hidden bg-neutral-100">
        <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
      </div>

      <div className="flex min-w-0 flex-col justify-center border-l border-border px-3 py-2 sm:px-5">
        <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
          বিজ্ঞাপন
        </span>
        <strong className="mt-0.5 line-clamp-2 font-ui text-sm leading-snug text-foreground sm:text-base">
          {title}
        </strong>
      </div>

      <div className="hidden items-center border-l border-border px-5 sm:flex">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-neutral-900 px-4 py-2 font-ui text-xs font-semibold text-white">
          বিস্তারিত দেখুন
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

/**
 * Public ad component. Fetches an active ad for the given slot, tracks one
 * impression per displayed ad, and tracks clicks on the complete creative.
 */
export function AdSlot({ slot, className = "" }: { slot: SlotType; className?: string }) {
  const [ad, setAd] = useState<Ad | null>(null);
  const impressedAdId = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setAd(null);

    adsApi
      .list(slot)
      .then((list) => {
        if (!cancelled) setAd(list[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setAd(null);
      });

    return () => {
      cancelled = true;
    };
  }, [slot]);

  useEffect(() => {
    if (ad && impressedAdId.current !== ad.id) {
      impressedAdId.current = ad.id;
      void adsApi.impression(ad.id);
    }
  }, [ad]);

  if (!ad) return null;

  return (
    <a
      href={ad.target_url}
      target="_blank"
      rel="noopener sponsored"
      onClick={() => void adsApi.click(ad.id)}
      className="block"
      aria-label={`${ad.title} — বিজ্ঞাপন`}
    >
      <AdCreative slot={slot} title={ad.title} imageUrl={ad.image_url} className={className} />
    </a>
  );
}
