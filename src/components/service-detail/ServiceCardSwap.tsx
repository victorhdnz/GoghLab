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
    <section className="relative py-8 md:py-16 lg:py-24 px-4 bg-black overflow-visible">
      <div className="container mx-auto max-w-7xl relative">
        <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8 lg:gap-12">
          {/* Conteúdo à esquerda */}
          <div className="flex-1 md:max-w-2xl relative z-10">
            {title && (
              <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 md:mb-4 tracking-tight break-words">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-base md:text-lg lg:text-xl text-white/80 break-words">
                {subtitle}
              </p>
            )}
          </div>

          {/* Cards animados à direita - sempre ao lado do texto */}
          <div className="relative w-full md:w-auto md:flex-shrink-0 md:mt-6 flex items-start justify-center md:justify-start">
            <div className="relative w-full md:w-[500px] min-h-[450px] md:min-h-[500px] overflow-visible">
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
                    customClass="p-6 md:p-8 lg:p-12 flex flex-col justify-start"
                  >
                    {card.image && (
                      <div className="mb-4 md:mb-6 relative w-full h-32 md:h-48 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={card.image}
                          alt={card.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 overflow-y-auto">
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 md:mb-4 break-words">
                        {card.title}
                      </h3>
                      {card.description && (
                        <p className="text-white/80 text-sm md:text-base lg:text-lg leading-relaxed break-words whitespace-normal">
                          {card.description}
                        </p>
                      )}
                      {card.custom_content && (
                        <div
                          className="text-white/80 text-sm md:text-base lg:text-lg leading-relaxed break-words"
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

