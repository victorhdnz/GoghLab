"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
  itemsForSelectedDate: PlannerItem[];
  loading?: boolean;
  onOpenItem: (item: PlannerItem) => void;
};

export function CalendarWithEventSlots({
  month,
  selectedDate,
  onMonthChange,
  onSelectDate,
  itemsForSelectedDate,
  loading = false,
  onOpenItem,
}: CalendarWithEventSlotsProps) {
  const hasItems = itemsForSelectedDate.length > 0;

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
            </div>
          ) : (
            itemsForSelectedDate.map((item) => {
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => onOpenItem(item)}
                  className="bg-muted hover:bg-muted/80 after:bg-primary/70 relative rounded-md p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full text-left transition-colors"
                >
                  <div className="font-medium truncate">{item.topic || "Vídeo sem tema"}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {item.script || item.caption || item.hashtags ? "Conteúdo gerado" : "Conteúdo pendente"}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
