"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Check, Clock } from "lucide-react";

const AVAILABLE_SLOTS = [
  { id: 1, day: "Tomorrow", time: "10:00 AM", label: "Morning" },
  { id: 2, day: "Tomorrow", time: "2:00 PM", label: "Afternoon" },
  { id: 3, day: "Wednesday", time: "11:30 AM", label: "Late Morning" },
  { id: 4, day: "Thursday", time: "9:00 AM", label: "Morning" },
  { id: 5, day: "Thursday", time: "3:30 PM", label: "Afternoon" },
  { id: 6, day: "Friday", time: "1:00 PM", label: "Midday" },
];

export default function InterviewCalendar() {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  function handleSelect(slotId: number) {
    if (isConfirmed) return;
    setSelectedSlot(slotId);
  }

  function handleConfirm() {
    if (selectedSlot === null) return;
    setIsConfirmed(true);
  }

  const confirmedSlot = AVAILABLE_SLOTS.find((s) => s.id === selectedSlot);

  return (
    <Card className="bg-zinc-900 border-zinc-700 text-zinc-100 mt-2 overflow-hidden shadow-lg max-w-md">
      <CardHeader className="pb-3 bg-gradient-to-r from-emerald-950/50 to-zinc-900 border-b border-zinc-800">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-400">
          <CalendarDays className="h-4 w-4" />
          {isConfirmed ? "Interview Confirmed" : "Select an Interview Slot"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 pb-4 space-y-3">
        {isConfirmed && confirmedSlot ? (
          /* ── Confirmed State ── */
          <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg p-4">
            <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-emerald-400 font-semibold text-sm">
                Booked: {confirmedSlot.day} at {confirmedSlot.time}
              </p>
              <p className="text-zinc-500 text-xs mt-0.5">
                {"You'll"} receive a calendar invite shortly.
              </p>
            </div>
          </div>
        ) : (
          /* ── Slot Selection Grid ── */
          <>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_SLOTS.map((slot) => (
                <Button
                  key={slot.id}
                  type="button"
                  variant="outline"
                  onClick={() => handleSelect(slot.id)}
                  className={`h-auto py-3 px-3 flex flex-col items-start gap-0.5 transition-all text-left ${
                    selectedSlot === slot.id
                      ? "bg-emerald-950/50 border-emerald-600 text-emerald-400 ring-1 ring-emerald-600/50"
                      : "bg-zinc-950 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900"
                  }`}
                >
                  <span className="text-xs font-semibold">{slot.day}</span>
                  <span className="flex items-center gap-1 text-xs opacity-80">
                    <Clock className="h-3 w-3" />
                    {slot.time}
                  </span>
                </Button>
              ))}
            </div>

            <Button
              type="button"
              onClick={handleConfirm}
              disabled={selectedSlot === null}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-9 text-sm disabled:opacity-30 transition-all"
            >
              Confirm Interview
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
