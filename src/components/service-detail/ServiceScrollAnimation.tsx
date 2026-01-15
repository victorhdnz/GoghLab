"use client";

import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Image from "next/image";

interface ServiceScrollAnimationProps {
  serviceName: string;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
}

export function ServiceScrollAnimation({
  serviceName,
  imageUrl,
  title,
  subtitle,
}: ServiceScrollAnimationProps) {
  // Se não houver imagem, usar uma imagem padrão relacionada ao serviço
  const displayImage = imageUrl || `https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1400&q=80`;

  // Usar subtitle como título principal, ou title, ou serviceName como fallback
  const mainTitle = subtitle || title || serviceName;

  return (
    <div 
      className="flex flex-col overflow-hidden bg-black"
      style={{
        touchAction: 'pan-y pinch-zoom',
      }}
    >
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl md:text-[6rem] font-bold leading-none text-white">
              {mainTitle}
            </h1>
          </>
        }
      >
        <Image
          src={displayImage}
          alt={serviceName}
          height={720}
          width={1400}
          className="mx-auto rounded-2xl object-cover h-full object-left-top"
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
}

