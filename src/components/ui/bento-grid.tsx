"use client"

import { ComponentPropsWithoutRef, ReactNode } from "react"
import { ArrowRight, ExternalLink } from "lucide-react"

import { cn } from "@/lib/utils"

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode
  className?: string
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string
  className: string
  background: ReactNode
  Icon: React.ElementType
  description: string
  href?: string
  cta: string
  onClick?: () => void
}

export const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  cta,
  onClick,
  ...props
}: BentoCardProps) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl",
      "bg-gray-900 border border-gray-800 [box-shadow:0_0_0_1px_rgba(255,255,255,.05),0_2px_4px_rgba(0,0,0,.3),0_12px_24px_rgba(0,0,0,.2)]",
      "transform-gpu cursor-pointer",
      className
    )}
    onClick={onClick}
    {...props}
  >
    <div>{background}</div>
    <div className="p-4">
      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 transition-all duration-300 lg:group-hover:-translate-y-10">
        <Icon className="h-12 w-12 origin-left transform-gpu text-white transition-all duration-300 ease-in-out group-hover:scale-75" />
        <h3 className="text-xl font-semibold text-white">
          {name}
        </h3>
        <p className="max-w-lg text-gray-300">{description}</p>
      </div>

      <div className="pointer-events-none flex w-full translate-y-0 transform-gpu flex-row items-center transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:hidden">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
          className="pointer-events-auto inline-flex items-center text-sm text-white hover:text-gray-300 transition-colors"
        >
          {cta}
          <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
        </button>
      </div>
    </div>

    <div className="pointer-events-none absolute bottom-0 hidden w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:flex">
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
        className="pointer-events-auto inline-flex items-center text-sm text-white hover:text-gray-300 transition-colors"
      >
        {cta}
        <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
      </button>
    </div>

    <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-white/[.05]" />
  </div>
)

export interface CourseBentoItem {
  id: string
  title: string
  description?: string | null
  imageUrl?: string | null
  status?: string
  tags?: string[]
  meta?: string
  cta?: string
  colSpan?: number
  hasPersistentHover?: boolean
}

interface CourseBentoGridProps {
  items: CourseBentoItem[]
  onItemClick?: (item: CourseBentoItem) => void
  selectedId?: string | null
  className?: string
}

export function CourseBentoGrid({ items, onItemClick, selectedId, className }: CourseBentoGridProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-3", className)}>
      {items.map((item) => {
        const isSelected = selectedId === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onItemClick?.(item)}
            className={cn(
              "group relative p-4 rounded-xl overflow-hidden transition-all duration-300 text-left",
              "border bg-white",
              "hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5",
              item.colSpan || "col-span-1",
              item.colSpan === 2 ? "md:col-span-2" : "",
              {
                "border-[#F7C948] shadow-[0_8px_22px_rgba(247,201,72,0.28)]": isSelected,
                "border-gray-200": !isSelected,
                "shadow-[0_4px_12px_rgba(0,0,0,0.05)] -translate-y-0.5": item.hasPersistentHover,
              }
            )}
          >
            <div
              className={cn(
                "absolute inset-0 transition-opacity duration-300",
                item.hasPersistentHover || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[length:4px_4px]" />
            </div>

            <div className="relative flex flex-col space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden bg-black/5 border border-gray-200">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-gray-600">Curso</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-1 rounded-lg",
                    "bg-black/5 text-gray-600 transition-colors",
                    "group-hover:bg-black/10",
                    isSelected && "bg-[#F7C948]/25 text-[#6B4E00]"
                  )}
                >
                  {item.status || "Ativo"}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 tracking-tight text-[15px] leading-tight">
                  {item.title}
                  {item.meta ? (
                    <span className="ml-2 text-xs text-gray-500 font-normal">{item.meta}</span>
                  ) : null}
                </h3>
                {item.description ? (
                  <p className="text-sm text-gray-600 leading-snug">{item.description}</p>
                ) : null}
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                  {item.tags?.map((tag) => (
                    <span
                      key={`${item.id}-${tag}`}
                      className="px-2 py-1 rounded-md bg-black/5 transition-all duration-200 hover:bg-black/10"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
                  {item.cta || "Abrir"}
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>

            <div
              className={cn(
                "absolute inset-0 -z-10 rounded-xl p-px bg-gradient-to-br from-transparent via-gray-100/70 to-transparent transition-opacity duration-300",
                item.hasPersistentHover || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
