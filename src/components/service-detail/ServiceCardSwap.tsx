"use client";

import React, { useState, useEffect } from "react";
import CardSwap, { Card } from "@/components/ui/card-swap";
import { CardSwapItem } from "@/types/service-detail";
import Image from "next/image";

interface ServiceCardSwapProps {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  cards?: CardSwapItem[];
  delay?: number;
  pauseOnHover?: boolean;
}

export function ServiceCardSwap({
  enabled = true,
  title,
  subtitle,
  cards = [],
  delay = 5000,
  pauseOnHover = false,
}: ServiceCardSwapProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!enabled || cards.length === 0) return null;

  const cardWidth = isMobile ? 350 : 500;
  const cardHeight = isMobile ? 300 : 400;

  return (
    <section className="relative py-8 md:py-16 lg:py-24 px-4 bg-black overflow-x-hidden">
      <div className="container mx-auto max-w-7xl relative overflow-x-hidden">
        <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8 lg:gap-12 overflow-x-hidden">
          {/* Conteúdo à esquerda */}
          <div className="flex-1 md:max-w-2xl relative z-10 w-full order-1">
            {title && (
              <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 md:mb-4 tracking-tight break-words">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-base md:text-lg lg:text-xl text-white/80 break-words mb-8 md:mb-0">
                {subtitle}
              </p>
            )}
          </div>

          {/* Cards animados à direita - abaixo do texto no mobile, ao lado no desktop */}
          <div className="relative w-full md:w-auto md:flex-shrink-0 mt-4 md:mt-16 flex items-start justify-center md:justify-start order-2 md:order-2 overflow-x-hidden" style={{ zIndex: 1, position: 'relative', clear: 'both' }}>
            <div className="relative w-full max-w-[350px] mx-auto md:mx-0 md:w-[500px] min-h-[300px] md:min-h-[500px] overflow-x-hidden" style={{ position: 'relative', isolation: 'isolate' }}>
              <CardSwap
                cardDistance={60}
                verticalDistance={70}
                delay={delay}
                pauseOnHover={pauseOnHover}
                width={cardWidth}
                height={cardHeight}
              >
                {cards.map((card) => (
                  <Card
                    key={card.id}
                    customClass="p-4 md:p-8 lg:p-12 flex flex-col justify-start overflow-y-auto"
                    style={{ 
                      maxHeight: isMobile ? '300px' : '400px'
                    }}
                  >
                    {card.image && (
                      <div className="mb-3 md:mb-6 relative w-full h-24 md:h-48 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={card.image}
                          alt={card.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-h-0">
                      <h3 className="text-lg md:text-2xl lg:text-3xl font-bold text-white mb-2 md:mb-4 break-words">
                        {card.title}
                      </h3>
                      {card.description && (
                        <p className="text-white/80 text-xs md:text-base lg:text-lg leading-relaxed break-words whitespace-normal">
                          {card.description}
                        </p>
                      )}
                      {card.custom_content && (
                        <div
                          className="text-white/80 text-xs md:text-base lg:text-lg leading-relaxed break-words"
                          dangerouslySetInnerHTML={{ __html: card.custom_content }}
                        />
                      )}
                    </div>
                  </Card>
                ))}
              </CardSwap>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

