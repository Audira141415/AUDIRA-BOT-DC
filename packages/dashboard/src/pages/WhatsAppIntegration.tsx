import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  QrCode,
  Smartphone,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  Radio,
  Zap,
  Clock,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { toast } from "../components/Toast";

export default function WhatsAppIntegrationPage() {
  const [config, setConfig] = useState<any | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.getBotConfigs();
      const configs: any[] = (res.data as any[]) ?? [];
      const wa = configs.find((c) => c.platform === "WHATSAPP");
      setConfig(wa ?? null);
    } catch (err) {
      console.error("Failed to fetch WhatsApp config", err);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  const fetchQR = useCallback(async (silent = false) => {
    if (!silent) setLoadingQr(true);
    try {
      const res = await api.getWhatsAppQR();
      setQr(res.qr ?? null);
      setLastRefresh(new Date());
      setCountdown(120);
    } catch (err) {
      if (!silent) toast({ type: "error", title: "QR_FETCH_FAILED", message: "Gagal mengambil QR code dari server." });
    } finally {
      if (!silent) setLoadingQr(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); fetchQR(true); }, [fetchConfig, fetchQR]);
  useEffect(() => { const t = setInterval(fetchConfig, 10000); return () => clearInterval(t); }, [fetchConfig]);
  useEffect(() => { const t = setInterval(() => fetchQR(true), 90000); return () => clearInterval(t); }, [fetchQR]);
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const isConnected = config?.connectionStatus === "CONNECTED";
  const isActive = config?.isActive ?? false;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Smartphone className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em] font-mono italic">
              WhatsApp Integration Control
            </span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic mb-2 underline decoration-emerald-500/30 decoration-8 underline-offset-[14px]">
            WA Pairing Hub
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-4 max-w-xl leading-relaxed">
            Scan QR code untuk menghubungkan WhatsApp ke bot. QR otomatis diperbarui dan tersedia kapan saja.
          </p>
        </div>
        <button
          onClick={() => { fetchConfig(); fetchQR(); }}
          className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-500/40 hover:text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
        >
          <RefreshCw className="w-4 h-4" /> Refresh QR
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white dark:bg-slate-950/60 border-2 border-slate-100 dark:border-slate-800/80 rounded-[56px] p-10 shadow-lg relative overflow-hidden backdrop-blur-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent pointer-events-none" />
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-emerald-600 rounded-[20px] text-white shadow-xl shadow-emerald-600/30">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">QR Pairing Code</h2>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] mt-1 font-mono">SCAN_WITH_WHATSAPP_MOBILE</p>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border mb-8 ${isConnected ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
            {isConnected ? "WhatsApp Terhubung" : "Menunggu Pairing"}
          </div>

          <div className="flex flex-col items-center justify-center min-h-[320px]">
            {loadingQr ? (
              <div className="flex flex-col items-center gap-5 py-16">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse font-mono">Mengambil QR Code...</span>
              </div>
            ) : qr ? (
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qr)}&margin=8&color=0f172a&bgcolor=ffffff`}
                    alt="WhatsApp QR Code"
                    className="w-72 h-72 rounded-[32px] shadow-2xl border-4 border-emerald-500/20 bg-white p-3"
                  />
                  <div className="absolute inset-0 rounded-[32px] ring-8 ring-emerald-500/10 pointer-events-none" />
                  {isConnected && (
                    <div className="absolute inset-0 bg-emerald-500/90 backdrop-blur-sm rounded-[32px] flex flex-col items-center justify-center gap-4">
                      <CheckCircle2 className="w-16 h-16 text-white" />
                      <span className="text-white font-black uppercase text-sm tracking-widest">Sudah Terhubung!</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest font-mono bg-slate-50 dark:bg-slate-900/60 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {countdown > 0 ? `QR kadaluarsa dalam ${countdown}s` : "QR sudah kadaluarsa — refresh!"}
                </div>
                {countdown === 0 && (
                  <button onClick={() => fetchQR()} className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-emerald-600/30 transition-all active:scale-95">
                    <RotateCcw className="w-4 h-4" /> Generate QR Baru
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 py-10 opacity-40">
                <QrCode className="w-20 h-20 text-slate-300 dark:text-slate-700" />
                <div className="text-center">
                  <p className="text-[13px] font-black uppercase tracking-[0.5em] text-slate-400 dark:text-slate-600 mb-2">QR Tidak Tersedia</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-wider">Bot mungkin belum aktif atau sudah terhubung</p>
                </div>
                <button onClick={() => fetchQR()} className="flex items-center gap-2 px-6 py-3 border-2 border-emerald-500/40 text-emerald-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500/10 transition-all active:scale-95">
                  <RefreshCw className="w-4 h-4" /> Coba Ambil QR
                </button>
              </div>
            )}
          </div>

          {lastRefresh && (
            <p className="text-center text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest font-mono mt-6">
              Terakhir diperbarui: {lastRefresh.toLocaleTimeString("id-ID", { hour12: false })}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-white dark:bg-slate-950/60 border-2 border-slate-100 dark:border-slate-800/80 rounded-[48px] p-10 shadow-sm backdrop-blur-3xl">
            <div className="flex items-center gap-4 mb-8">
              <div className={`p-4 rounded-[20px] text-white shadow-xl ${isConnected ? "bg-emerald-600 shadow-emerald-600/30" : "bg-rose-500 shadow-rose-500/30"}`}>
                {isConnected ? <Wifi className="w-7 h-7" /> : <WifiOff className="w-7 h-7" />}
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Status Koneksi</h2>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] mt-1 font-mono">WHATSAPP_BOT_STATUS</p>
              </div>
            </div>

            {loadingConfig ? (
              <div className="flex items-center gap-4 py-6">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Memuat status...</span>
              </div>
            ) : config ? (
              <div className="space-y-4">
                {[
                  { label: "Status", value: config.connectionStatus?.replace("_", " ") || "UNKNOWN", color: isConnected ? "text-emerald-500" : "text-rose-500", icon: isConnected ? CheckCircle2 : XCircle },
                  { label: "Bot Aktif", value: isActive ? "YA — OPERATIONAL" : "TIDAK — STANDBY", color: isActive ? "text-emerald-500" : "text-slate-400", icon: isActive ? Zap : Radio },
                  { label: "Terakhir Terhubung", value: config.lastConnectedAt ? new Date(config.lastConnectedAt).toLocaleString("id-ID") : "Belum pernah", color: "text-slate-700 dark:text-slate-300", icon: Clock },
                  { label: "Versi", value: config.version || "1.0.0", color: "text-indigo-500", icon: ShieldCheck },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-slate-800/60 hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">{item.label}</span>
                    </div>
                    <span className={`text-[12px] font-black uppercase italic tracking-tight ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 opacity-40">
                <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Config tidak ditemukan</p>
              </div>
            )}
          </div>

          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-[48px] p-10 shadow-sm backdrop-blur-3xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl">
                <Info className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Cara Menghubungkan WA</h3>
            </div>
            <ol className="space-y-5">
              {[
                { step: "1", text: "Buka WhatsApp di HP kamu" },
                { step: "2", text: "Ketuk ikon titik tiga (?) di pojok kanan atas" },
                { step: "3", text: "Pilih menu \"Perangkat Tertaut\" (Linked Devices)" },
                { step: "4", text: "Ketuk \"Tautkan Perangkat\" (Link a Device)" },
                { step: "5", text: "Scan QR Code yang ada di sebelah kiri ?" },
              ].map((item) => (
                <li key={item.step} className="flex items-start gap-4">
                  <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-[11px] font-black flex-shrink-0 shadow-lg shadow-emerald-600/30">{item.step}</span>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-snug mt-1">{item.text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-8 p-5 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                QR Code berlaku selama <strong>2 menit</strong>. Jika kadaluarsa, klik tombol <strong>Refresh QR</strong> untuk mendapatkan QR baru.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
