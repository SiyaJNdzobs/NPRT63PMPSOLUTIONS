import React from "react";
import { CheckCircle2, AlertCircle, Check } from "lucide-react";
import {
  Dialog, DialogContent, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ResultModal({ result, onClose }) {
  const open = !!result;
  const ok = result?.type === "success";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#151B27] border-2 border-[#263144] text-white max-w-md p-6 rounded-2xl shadow-2xl text-center" data-testid="result-modal">
        <div className="flex flex-col items-center justify-center space-y-4 pt-2">
          <div className={`h-16 w-16 rounded-full flex items-center justify-center shadow-lg ${
            ok ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-red-500/20 text-red-400 border border-red-500/40"
          }`}>
            {ok ? (
              <CheckCircle2 size={40} className="stroke-[2.5]" />
            ) : (
              <AlertCircle size={40} className="stroke-[2.5]" />
            )}
          </div>

          <div className="space-y-2 w-full">
            <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white" data-testid="result-modal-title">
              {result?.title || (ok ? "Action Completed Successfully" : "Action Could Not Be Completed")}
            </h2>
            <div className="p-3.5 bg-[#0A0D14] border border-[#263144] rounded-xl text-slate-200 text-sm sm:text-base leading-relaxed text-center" data-testid="result-modal-message">
              {result?.message}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 sm:justify-center">
          <Button
            onClick={onClose}
            data-testid="result-modal-close"
            className={`w-full sm:w-48 h-12 text-base font-bold tracking-wide rounded-xl shadow-lg gap-2 ${
              ok
                ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
                : "bg-primary hover:bg-primary/90 text-black shadow-primary/20"
            }`}
          >
            <Check size={20} className="stroke-[3]" /> OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
