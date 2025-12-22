"use client";

import React from "react";
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
  if (!enabled || cards.length === 0) return null;

  return (
    <section className="relative py-8 md:py-16 lg:py-24 px-4 bg-black min-h-[400px] md:min-h-[600px] overflow-hidden">
      <div className="container mx-auto max-w-7xl relative">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 md:gap-4 lg:gap-6">
          {/* Conteúdo à esquerda */}
          <div className="flex-1 max-w-2xl relative z-10">
            {title && (
              <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 md:mb-4 tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-base md:text-lg lg:text-xl text-white/80">
                {subtitle}
              </p>
            )}
          </div>

          {/* Cards animados à direita */}
          <div className="relative w-full lg:w-auto lg:flex-shrink-0 -mt-4 md:mt-0" style={{ height: '400px', minHeight: '400px' }}>
            <CardSwap
              cardDistance={60}
              verticalDistance={70}
              delay={delay}
              pauseOnHover={pauseOnHover}
              width={500}
              height={400}
            >
              {cards.map((card) => (
                <Card
                  key={card.id}
                  customClass="p-8 md:p-12 flex flex-col justify-between"
                >
                  {card.image && (
                    <div className="mb-6 relative w-full h-48 rounded-lg overflow-hidden">
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                      {card.title}
                    </h3>
                    {card.description && (
                      <p className="text-white/80 text-base md:text-lg leading-relaxed">
                        {card.description}
                      </p>
                    )}
                    {card.custom_content && (
                      <div
                        className="text-white/80 text-base md:text-lg leading-relaxed"
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
    </section>
  );
}

