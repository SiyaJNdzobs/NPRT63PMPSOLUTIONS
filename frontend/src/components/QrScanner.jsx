import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const REGION_ID = "erank-qr-region";

export function QrScanner({ onResult, onError }) {
  const scannerRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(REGION_ID, { verbose: false });
    scannerRef.current = scanner;
    const config = { fps: 10, qrbox: { width: 240, height: 240 } };

    scanner
      .start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          if (doneRef.current) return;
          doneRef.current = true;
          scanner.stop().catch(() => {}).finally(() => onResult(decodedText));
        },
        () => {}
      )
      .catch((err) => onError && onError(err));

    return () => {
      const s = scannerRef.current;
      if (s) {
        try {
          if (s.isScanning) s.stop().then(() => s.clear()).catch(() => {});
          else s.clear();
        } catch (_) {}
      }
    };
  }, [onResult, onError]);

  return <div id={REGION_ID} className="w-full overflow-hidden rounded-xl bg-black" />;
}
