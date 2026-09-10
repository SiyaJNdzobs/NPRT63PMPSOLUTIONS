import React from "react";

export function AppFooter() {
  return (
    <footer
      data-testid="app-footer"
      className="border-t border-[#263144] py-6 px-4 text-center bg-[#0A0D14]"
    >
      <div className="text-xs text-slate-500">
        EST 2026 · Developed by <span className="text-slate-300 font-semibold">PMP Solutions</span>
      </div>
    </footer>
  );
}
