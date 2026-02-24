"use client";

import * as React from "react";
import { PlusIcon, Sparkles, FileText, Type, Clock } from "lucide-react";

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
  generatingId: string | null;
  canInteract: boolean;
  onCreateForSelectedDate: () => void;
  onGenerate: (itemId: string) => void;
  onCopyScript: (item: PlannerItem) => void;
  onCopyCaptionHashtags: (item: PlannerItem) => void;
  onCopyRecommendedTime: (item: PlannerItem) => void;
  getRecommendedTime: (item: PlannerItem) => string | null;
};

export function CalendarWithEventSlots({
  month,
  selectedDate,
  onMonthChange,
  onSelectDate,
  itemsForSelectedDate,
  loading = false,
  generatingId,
  canInteract,
  onCreateForSelectedDate,
  onGenerate,
  onCopyScript,
  onCopyCaptionHashtags,
  onCopyRecommendedTime,
  getRecommendedTime,
}: CalendarWithEventSlotsProps) {
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
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            title="Adicionar vídeo"
            onClick={onCreateForSelectedDate}
            disabled={!canInteract || loading}
          >
            <PlusIcon className="w-4 h-4" />
            <span className="sr-only">Adicionar vídeo</span>
          </Button>
        </div>

        <div className="flex w-full flex-col gap-2">
          {loading ? (
            <div className="flex justify-center py-4">
              <LumaSpin size="sm" />
            </div>
          ) : itemsForSelectedDate.length === 0 ? (
            <div className="bg-muted/50 relative rounded-md p-2 pl-4 text-sm">
              <div className="font-medium text-muted-foreground">Nenhum vídeo planejado neste dia</div>
            </div>
          ) : (
            itemsForSelectedDate.map((item) => {
              const hasGenerated = !!item.script || !!item.caption || !!item.hashtags;
              const recTime = getRecommendedTime(item);
              return (
                <div
                  key={item.id}
                  className="bg-muted after:bg-primary/70 relative rounded-md p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full"
                >
                  <div className="font-medium truncate">{item.topic || "Vídeo sem tema"}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => onGenerate(item.id)}
                      disabled={!canInteract || !!generatingId}
                      className="inline-flex items-center gap-1 rounded-md bg-[#F7C948] px-2 py-1 text-[11px] font-medium text-[#0A0A0A] disabled:opacity-60"
                    >
                      {generatingId === item.id ? <LumaSpin size="sm" /> : <Sparkles className="w-3 h-3" />}
                      {generatingId === item.id ? "Gerando..." : hasGenerated ? "Regenerar" : "Gerar"}
                    </button>

                    {hasGenerated && (
                      <>
                        <button
                          type="button"
                          onClick={() => onCopyScript(item)}
                          className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-1 text-[11px]"
                        >
                          <FileText className="w-3 h-3" />
                          Roteiro
                        </button>
                        <button
                          type="button"
                          onClick={() => onCopyCaptionHashtags(item)}
                          className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-1 text-[11px]"
                        >
                          <Type className="w-3 h-3" />
                          Legenda + hashtags
                        </button>
                        <button
                          type="button"
                          onClick={() => onCopyRecommendedTime(item)}
                          className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-1 text-[11px]"
                        >
                          <Clock className="w-3 h-3" />
                          {recTime || "Horário"}
                        </button>
                      </>
                    )}
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
