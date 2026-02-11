"use client";

import { ArrowRight, ChevronLeft, ChevronRight, Play, X } from "lucide-react";
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

export type GalleryHoverCarouselItem = {
  id: string;
  type: "image" | "video";
  title: string;
  summary: string;
  image: string;
  /** Link opcional para cards do tipo image */
  url?: string;
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
    <section className="py-32 bg-background">
      <div className="container mx-auto px-6">
        <div className="mb-8 flex flex-col justify-between md:mb-14 md:flex-row md:items-end lg:mb-16">
          <div className="max-w-2xl">
            <h3 className="text-lg sm:text-xl lg:text-3xl font-medium text-gray-900 dark:text-white leading-relaxed">
              {heading}{" "}
              <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base lg:text-3xl">
                {subtitle}
              </span>
            </h3>
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

        <div className="w-full max-w-full">
          <Carousel
            setApi={setCarouselApi}
            opts={{
              loop: true,
              align: "start",
              breakpoints: { "(max-width: 768px)": { dragFree: true } },
            }}
            className="relative w-full max-w-full"
          >
            <CarouselContent className="hide-scrollbar w-full max-w-full md:ml-4 md:-mr-4">
              {items.map((item) => (
                <CarouselItem key={item.id} className="ml-6 md:max-w-[350px]">
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
                src={getYouTubeEmbedUrl(modalVideo.url, true)}
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
  const Wrapper = item.url ? Link : "div";
  const wrapperProps = item.url ? { href: item.url } : {};
  return (
    <Wrapper
      {...wrapperProps}
      className="group block relative w-full aspect-video min-h-[200px] md:min-h-[220px]"
    >
      <Card className="overflow-hidden rounded-xl h-full w-full rounded-3xl">
        <div className="relative h-full w-full transition-all duration-500 group-hover:h-1/2">
          <Image
            width={400}
            height={225}
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover object-center aspect-video"
          />
          <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        <div className="absolute bottom-0 left-0 w-full px-4 transition-all duration-500 group-hover:h-1/2 group-hover:flex flex-col justify-center bg-background/95 backdrop-blur-sm opacity-0 group-hover:opacity-100">
          <h3 className="text-lg font-medium md:text-xl">{item.title}</h3>
          <p className="text-muted-foreground text-sm md:text-base line-clamp-2">
            {item.summary}
          </p>
          {item.url && (
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-2 right-2 border border-gray-200 dark:border-gray-800 hover:-rotate-45 transition-all duration-500 rounded-full mt-2 px-0 flex items-center gap-1 text-primary hover:text-primary/80"
            >
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </Card>
    </Wrapper>
  );
}

function VideoCard({
  item,
  onPlay,
}: {
  item: GalleryHoverCarouselItem;
  onPlay: () => void;
}) {
  return (
    <div className="group block relative w-full aspect-video min-h-[200px] md:min-h-[220px]">
      <Card className="overflow-hidden rounded-xl h-full w-full rounded-3xl">
        <div
          className="relative h-full w-full transition-all duration-500 group-hover:h-1/2 cursor-pointer"
          onClick={onPlay}
        >
          <Image
            width={400}
            height={225}
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover object-center aspect-video"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <span className="rounded-full bg-white/90 p-4 text-black shadow-lg transition-transform group-hover:scale-110">
              <Play className="h-8 w-8 fill-current" />
            </span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        <div className="absolute bottom-0 left-0 w-full px-4 transition-all duration-500 group-hover:h-1/2 group-hover:flex flex-col justify-center bg-background/95 backdrop-blur-sm opacity-0 group-hover:opacity-100">
          <h3 className="text-lg font-medium md:text-xl">{item.title}</h3>
          <p className="text-muted-foreground text-sm md:text-base line-clamp-2">
            {item.summary}
          </p>
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="absolute bottom-2 right-2 border border-gray-200 dark:border-gray-800 hover:-rotate-45 transition-all duration-500 rounded-full mt-2 px-0 flex items-center gap-1 text-primary hover:text-primary/80"
          >
            <Play className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
