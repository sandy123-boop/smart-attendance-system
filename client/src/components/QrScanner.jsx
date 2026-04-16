import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const ELEMENT_ID = 'qr-scanner-region';

export default function QrScanner({ onDecode, paused }) {
  const scannerRef = useRef(null);
  const runningRef = useRef(false);
  const handledRef = useRef(false);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState('init'); // init | scanning | error
  const [errorMsg, setErrorMsg] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const requestPermission = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (mountedRef.current) {
        setStatus('error');
        setErrorMsg(
          window.isSecureContext
            ? 'Camera API not available on this browser.'
            : 'Camera requires HTTPS. Make sure you are using https:// in the URL.'
        );
      }
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch (err) {
      if (mountedRef.current) {
        setStatus('error');
        setErrorMsg(
          err.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access in your browser settings, then tap retry.'
            : err.name === 'NotFoundError'
            ? 'No camera found on this device.'
            : `Camera error: ${err.message}`
        );
      }
      return false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (paused || status === 'error') return;

    let cancelled = false;

    const run = async () => {
      const ok = await requestPermission();
      if (!ok || cancelled) return;

      // Wait for DOM element
      await new Promise((r) => setTimeout(r, 100));

      const el = document.getElementById(ELEMENT_ID);
      if (!el || cancelled) return;

      const scanner = new Html5Qrcode(ELEMENT_ID, { verbose: false });
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (handledRef.current) return;
            handledRef.current = true;
            onDecode?.(decoded);
          },
          () => {}
        );
        if (cancelled) {
          await scanner.stop().catch(() => {});
          return;
        }
        runningRef.current = true;
        if (mountedRef.current) setStatus('scanning');
      } catch (err) {
        if (mountedRef.current) {
          setStatus('error');
          setErrorMsg(`Scanner failed: ${err.message || err}`);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      const s = scannerRef.current;
      if (s && runningRef.current) {
        s.stop().then(() => s.clear()).catch(() => {});
        runningRef.current = false;
      }
      scannerRef.current = null;
    };
  }, [paused, retryKey]);

  const handleRetry = () => {
    handledRef.current = false;
    runningRef.current = false;
    scannerRef.current = null;
    setStatus('init');
    setErrorMsg('');
    setRetryKey((k) => k + 1);
  };

  if (status === 'error') {
    return (
      <div className="w-full max-w-md mx-auto rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <div className="text-4xl">📷</div>
        <p className="mt-3 text-sm text-slate-600">{errorMsg}</p>
        <button
          onClick={handleRetry}
          className="mt-4 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
        >
          Retry camera
        </button>
        <p className="mt-3 text-xs text-slate-400">
          On phones: tap the lock icon in the address bar → Permissions → Camera → Allow, then tap retry.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        id={ELEMENT_ID}
        key={retryKey}
        className="w-full rounded-2xl overflow-hidden bg-slate-900"
        style={{ minHeight: 280 }}
      />
      {status === 'init' && (
        <div className="mt-3 text-center text-sm text-slate-500">Starting camera…</div>
      )}
    </div>
  );
}
