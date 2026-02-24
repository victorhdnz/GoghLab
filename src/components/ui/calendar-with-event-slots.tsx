"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { HoverButton } from "@/components/ui/hover-button";
import { LumaSpin } from "@/components/ui/luma-spin";

type PlannerItem = {
  id: string;
  date: string;
  time: string | null;
  platform: string | null;
  topic: string | null;
  status: string;
  script: string | null;
  caption: string | null;
  hashtags: string | null;
  meta: any | null;
};

type CalendarWithEventSlotsProps = {
  month: Date;
  selectedDate: Date;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date | undefined) => void;
  itemsForMonth: PlannerItem[];
  itemsForSelectedDate: PlannerItem[];
  loading?: boolean;
  canInteract?: boolean;
  onCreateForSelectedDate?: () => void;
  onOpenItem: (item: PlannerItem) => void;
  onRegenerateForItem?: (item: PlannerItem) => void;
  regeneratingId?: string | null;
};

export function CalendarWithEventSlots({
  month,
  selectedDate,
  onMonthChange,
  onSelectDate,
  itemsForMonth,
  itemsForSelectedDate,
  loading = false,
  canInteract = true,
  onCreateForSelectedDate,
  onOpenItem,
  onRegenerateForItem,
  regeneratingId = null,
}: CalendarWithEventSlotsProps) {
  const formatDateKey = React.useCallback((date: Date) => {
    const year = date.getFullYear();
    const monthValue = String(date.getMonth() + 1).padStart(2, "0");
    const dayValue = String(date.getDate()).padStart(2, "0");
    return `${year}-${monthValue}-${dayValue}`;
  }, []);

  const daysWithContent = React.useMemo(() => {
    return new Set(
      itemsForMonth
        .filter((item) => Boolean(item.script || item.caption || item.hashtags || item.status === "generated"))
        .map((item) => item.date)
    );
  }, [itemsForMonth]);

  return (
    <Card className="w-full max-w-[430px] py-4">
      <CardContent className="px-4">
        <Calendar
          mode="single"
          month={month}
          selected={selectedDate}
          onMonthChange={onMonthChange}
          onSelect={onSelectDate}
          className="bg-transparent p-0"
          modifiers={{
            hasContent: (date) => daysWithContent.has(formatDateKey(date)),
          }}
          modifiersClassNames={{
            hasContent:
              "[&>button]:bg-[#F7C948]/35 [&>button]:text-[#0A0A0A] [&>button]:shadow-[inset_0_0_0_1px_rgba(247,201,72,0.75)]",
          }}
          required
        />
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3 border-t px-4 !pt-4">
        <div className="flex w-full items-center justify-between px-1">
          <div className="text-sm font-medium">
            {selectedDate.toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2">
          {loading ? (
            <div className="flex justify-center py-4">
              <LumaSpin size="sm" />
            </div>
          ) : itemsForSelectedDate.length === 0 ? (
            <div className="bg-muted/50 relative rounded-md p-3 text-sm">
              <div className="font-medium text-muted-foreground text-center">
                Nenhum vídeo planejado neste dia
              </div>
              {onCreateForSelectedDate ? (
                <Button
                  size="sm"
                  onClick={onCreateForSelectedDate}
                  disabled={!canInteract || loading}
                  className="mt-3 w-full bg-[#F7C948] text-[#0A0A0A] hover:bg-[#F7C948]/90"
                >
                  Criar vídeo
                </Button>
              ) : null}
            </div>
          ) : (
            itemsForSelectedDate.map((item) => {
              const regenerateCount = Number(item.meta?.regenerate_count ?? 0)
              const isRegenerating = regeneratingId === item.id
              const hasGeneratedContent = Boolean(item.script || item.caption || item.hashtags || item.status === "generated")
              return (
                <div
                  key={item.id}
                  className={
                    hasGeneratedContent
                      ? "bg-muted relative rounded-md p-2 pl-6 text-sm border border-[#F7C948]/45 shadow-[0_0_0_1px_rgba(247,201,72,0.24),0_0_18px_rgba(247,201,72,0.25)] after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full after:bg-[#F7C948] transition-all hover:shadow-[0_0_0_1px_rgba(247,201,72,0.45),0_0_24px_rgba(247,201,72,0.35)]"
                      : "bg-muted relative rounded-md p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full after:bg-primary/70"
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenItem(item)}
                      className={
                        hasGeneratedContent
                          ? "min-w-0 flex-1 text-left cursor-pointer transition-all hover:opacity-95"
                          : "min-w-0 flex-1 text-left hover:opacity-90 transition-opacity"
                      }
                    >
                      <div className="font-medium truncate">{item.topic || "Vídeo sem tema"}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {item.script || item.caption || item.hashtags ? "Conteúdo gerado" : "Conteúdo pendente"}
                      </div>
                    </button>
                    <HoverButton
                      type="button"
                      className="shrink-0"
                      onClick={() => onRegenerateForItem?.(item)}
                      disabled={!canInteract || isRegenerating || regenerateCount >= 2}
                    >
                      {isRegenerating ? "Gerando..." : "Gerar novamente"}
                    </HoverButton>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
