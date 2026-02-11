"use client";

import { ArrowRight, ChevronLeft, ChevronRight, Play, X, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";
import Image from "next/image";
import Link from "next/link";
import { getYouTubeEmbedUrl } from "@/lib/utils/youtube";
import { SparklesText } from "@/components/ui/sparkles-text";

export type GalleryHoverCarouselItem = {
  id: string;
  type: "image" | "video";
  title: string;
  summary: string;
  image: string;
  /** Link opcional para cards do tipo image */
  url?: string;
  /** Prompt para preencher no Criar com IA ao clicar em "Testar e criar" */
  prompt?: string;
  /** Quando preenchido (espelho de creation_prompts), link abre o card desse prompt na página Criar */
  promptId?: string;
  /** Aba da página Criar (foto | video | roteiro | vangogh) */
  tabId?: string;
  /** URL do vídeo no Cloudinary (upload) — usado na galeria */
  videoUrl?: string;
  /** URL do YouTube para cards do tipo video (legado; cursos continuam com YouTube) */
  youtubeUrl?: string;
};

function isCloudinaryVideoUrl(url: string): boolean {
  return /res\.cloudinary\.com.*\/video\/upload\//.test(url) || /cloudinary\.com.*video/.test(url);
}

const DEFAULT_ITEMS: GalleryHoverCarouselItem[] = [
  {
    id: "item-1",
    type: "image",
    title: "Build Modern UIs",
    summary:
      "Create stunning user interfaces with our comprehensive design system.",
    url: "#",
    image:
      "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/dashboard-02.png",
  },
  {
    id: "item-2",
    type: "video",
    title: "Computer Vision Technology",
    summary:
      "Powerful image recognition and processing capabilities that allow AI systems to analyze visual information.",
    image:
      "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/dashboard-gradient.png",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
];

type GalleryHoverCarouselProps = {
  heading?: string;
  subtitle?: string;
  items?: GalleryHoverCarouselItem[];
  /** Intervalo em ms para auto-slide (0 = desligado) */
  autoSlideInterval?: number;
};

export default function GalleryHoverCarousel({
  heading = "Featured Projects",
  subtitle = "Explore our collection of innovative solutions and cutting-edge technologies designed to transform your business.",
  items = DEFAULT_ITEMS,
  autoSlideInterval = 5000,
}: GalleryHoverCarouselProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [modalVideo, setModalVideo] = useState<{ type: "youtube" | "cloudinary"; url: string } | null>(null);

  const updateScrollState = useCallback(() => {
    if (!carouselApi) return;
    setCanScrollPrev(carouselApi.canScrollPrev());
    setCanScrollNext(carouselApi.canScrollNext());
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;
    updateScrollState();
    carouselApi.on("select", updateScrollState);
    return () => {
      carouselApi.off("select", updateScrollState);
    };
  }, [carouselApi, updateScrollState]);

  // Auto-slide com loop
  useEffect(() => {
    if (!carouselApi || autoSlideInterval <= 0) return;
    const timer = setInterval(() => {
      if (carouselApi.canScrollNext()) {
        carouselApi.scrollNext();
      } else {
        carouselApi.scrollTo(0);
      }
    }, autoSlideInterval);
    return () => clearInterval(timer);
  }, [carouselApi, autoSlideInterval]);


  return (
    <section className="py-8 sm:py-10 md:py-12 bg-background">
      <div className="container mx-auto px-3 sm:px-4 max-w-4xl">
        <div className="mb-4 sm:mb-6 flex flex-col justify-between md:flex-row md:items-end">
          <div className="max-w-xl">
            <SparklesText
              text={heading}
              className="text-gray-900 dark:text-white"
              colors={{ first: "#EAB308", second: "#0a0a0a" }}
              sparklesCount={10}
            />
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => carouselApi?.scrollPrev()}
              disabled={!canScrollPrev}
              className="h-10 w-10 rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => carouselApi?.scrollNext()}
              disabled={!canScrollNext}
              className="h-10 w-10 rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="w-full max-w-full overflow-hidden">
          <Carousel
            setApi={setCarouselApi}
            opts={{
              loop: true,
              align: "start",
              breakpoints: { "(max-width: 768px)": { dragFree: true } },
            }}
            className="relative w-full max-w-full"
          >
            <CarouselContent className="hide-scrollbar w-full max-w-full md:ml-2 md:-mr-2 -ml-2 md:ml-2">
              {items.map((item) => (
                <CarouselItem key={item.id} className="pl-2 pr-1 md:pl-4 md:pr-0 w-[165px] sm:w-[200px] md:w-[220px] lg:w-[240px] shrink-0 flex">
                  {item.type === "video" && (item.videoUrl || item.youtubeUrl) ? (
                    <VideoCard
                      item={item}
                      onPlay={() => {
                        if (item.videoUrl && isCloudinaryVideoUrl(item.videoUrl)) {
                          setModalVideo({ type: "cloudinary", url: item.videoUrl });
                        } else if (item.youtubeUrl) {
                          setModalVideo({ type: "youtube", url: item.youtubeUrl });
                        }
                      }}
                    />
                  ) : (
                    <ImageCard item={item} />
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>

      {/* Modal de vídeo (Cloudinary ou YouTube) */}
      {modalVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setModalVideo(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Assistir vídeo"
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalVideo(null)}
              className="absolute top-2 right-2 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
            {modalVideo.type === "cloudinary" ? (
              <video
                src={modalVideo.url}
                controls
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              <iframe
                src={getYouTubeEmbedUrl(modalVideo.url, true) ?? undefined}
                title="Vídeo do YouTube"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function ImageCard({ item }: { item: GalleryHoverCarouselItem }) {
  const className = "block w-full";
  const content = (
    <Card className="overflow-hidden rounded-lg h-full w-full flex flex-col">
      <div className="relative w-full aspect-video min-h-[90px] sm:min-h-[100px] bg-muted/50 flex-shrink-0">
        <Image
          width={320}
          height={180}
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover object-center"
          sizes="(max-width: 768px) 200px, 240px"
        />
      </div>
      <div className="p-2 sm:p-2.5 flex flex-col flex-1 min-w-0 bg-background">
        <h3 className="text-xs font-medium sm:text-sm line-clamp-1">{item.title}</h3>
        <p className="text-muted-foreground text-[11px] sm:text-xs line-clamp-2 mt-0.5">
          {item.summary}
        </p>
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {(item.prompt || item.promptId) && (
            <Link
              href={
                item.promptId && item.tabId
                  ? `/criar/gerar?promptId=${encodeURIComponent(item.promptId)}&tab=${encodeURIComponent(item.tabId)}`
                  : `/criar/gerar?prompt=${encodeURIComponent(item.prompt ?? '')}`
              }
            >
              <Button size="sm" className="gap-1 text-[11px] h-7">
                <Sparkles className="size-3.5" />
                Testar e criar
              </Button>
            </Link>
          )}
          {item.url && (
            <Link href={item.url}>
              <Button variant="outline" size="icon" className="rounded-full h-8 w-8">
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
  if (item.url && !item.prompt) {
    return (
      <Link href={item.url} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}

function VideoCard({
  item,
  onPlay,
}: {
  item: GalleryHoverCarouselItem;
  onPlay: () => void;
}) {
  return (
    <div className="block w-full">
      <Card className="overflow-hidden rounded-lg h-full w-full flex flex-col">
        <div
          className="relative w-full aspect-video min-h-[90px] sm:min-h-[100px] bg-muted/50 flex-shrink-0 cursor-pointer"
          onClick={onPlay}
        >
          <Image
            width={320}
            height={180}
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover object-center"
            sizes="(max-width: 768px) 200px, 240px"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
            <span className="rounded-full bg-white/90 p-2 text-black shadow-lg">
              <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-current" />
            </span>
          </div>
        </div>
        <div className="p-2 sm:p-2.5 flex flex-col flex-1 min-w-0 bg-background">
          <h3 className="text-xs font-medium sm:text-sm line-clamp-1">{item.title}</h3>
          <p className="text-muted-foreground text-[11px] sm:text-xs line-clamp-2 mt-0.5">
            {item.summary}
          </p>
          <div className="flex gap-1 mt-1.5 flex-wrap items-center">
            {(item.prompt || item.promptId) && (
              <Link
                href={
                  item.promptId && item.tabId
                    ? `/criar/gerar?promptId=${encodeURIComponent(item.promptId)}&tab=${encodeURIComponent(item.tabId)}`
                    : `/criar/gerar?prompt=${encodeURIComponent(item.prompt ?? '')}`
                }
                onClick={(e) => e.stopPropagation()}
              >
                <Button size="sm" className="gap-1 text-[11px] h-7">
                  <Sparkles className="size-3.5" />
                  Testar e criar
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
              className="rounded-full h-7 w-7"
            >
              <Play className="size-3" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
