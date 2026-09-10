import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ResultModal({ result, onClose }) {
  const open = !!result;
  const ok = result?.type === "success";
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#181F2C] border-[#263144]" data-testid="result-modal">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {ok ? (
              <CheckCircle2 className="text-emerald-400" size={28} />
            ) : (
              <XCircle className="text-red-400" size={28} />
            )}
            <DialogTitle className="text-white" data-testid="result-modal-title">
              {result?.title || (ok ? "Success" : "Something went wrong")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-300 pt-2 text-sm" data-testid="result-modal-message">
            {result?.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={onClose}
            data-testid="result-modal-close"
            className={ok ? "bg-emerald-500 hover:bg-emerald-600 text-black" : "bg-primary hover:bg-primary/90 text-black"}
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
