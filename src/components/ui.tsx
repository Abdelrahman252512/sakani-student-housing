"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { X, Star, BadgeCheck, Loader2, Inbox } from "lucide-react";
import { ReactNode, useState } from "react";

export const inp = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition disabled:bg-slate-50";
export const lbl = "block text-[13px] font-bold text-deep mb-1.5";
export const btnP = "inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm px-5 py-2.5 transition disabled:opacity-50 disabled:pointer-events-none shadow-sm shadow-primary/20";
export const btnS = "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white hover:border-primary hover:text-primary font-bold text-sm px-4 py-2.5 transition disabled:opacity-50";
export const btnD = "inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-4 py-2.5 transition disabled:opacity-50";
export const card = "bg-white rounded-2xl border border-line shadow-[0_1px_3px_rgba(18,59,64,.05)]";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <div><label className={lbl}>{label}</label>{children}{hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}</div>;
}
export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-deep/50 backdrop-blur-[2px] p-0 sm:p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`bg-white w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl fade-up`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-white rounded-t-3xl z-10">
          <h3 className="font-black text-deep text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-mint text-muted" aria-label="إغلاق"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
export function Stars({ v, set, size = 16 }: { v: number; set?: (n: number) => void; size?: number }) {
  return <div className="flex gap-0.5" dir="ltr">{[1, 2, 3, 4, 5].map(i => (
    <button key={i} type="button" disabled={!set} onClick={() => set?.(i)} className={set ? "cursor-pointer" : "cursor-default"} aria-label={`${i} نجوم`}>
      <Star size={size} className={i <= Math.round(v) ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
    </button>))}</div>;
}
export function VerifiedBadge({ small }: { small?: boolean }) {
  return <span className={`inline-flex items-center gap-1 rounded-full bg-primary text-white font-bold ${small ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"}`} title="تمت مراجعة مستندات الملكية ومعاينة السكن"><BadgeCheck size={small ? 12 : 14} /> موثّق</span>;
}
export function Empty({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return <div className="text-center py-14 px-4">
    <div className="mx-auto w-16 h-16 rounded-2xl bg-mint flex items-center justify-center text-primary mb-4"><Inbox size={30} /></div>
    <p className="font-black text-deep text-lg">{title}</p>{sub && <p className="text-muted text-sm mt-1 max-w-md mx-auto">{sub}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>;
}
export function Loading({ rows = 3 }: { rows?: number }) {
  return <div className="space-y-3 py-6">{Array.from({ length: rows }).map((_, i) => <div key={i} className="skel h-24" />)}<p className="text-center text-muted text-sm flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16} /> جارٍ التحميل…</p></div>;
}
export function ConfirmBtn({ label, onConfirm, className = btnD, confirmLabel = "متأكد؟ اضغط تاني للتأكيد" }: { label: string; onConfirm: () => void; className?: string; confirmLabel?: string }) {
  const [armed, setArmed] = useState(false);
  return <button className={className} onClick={() => { if (armed) onConfirm(); else { setArmed(true); setTimeout(() => setArmed(false), 3000); } }}>{armed ? confirmLabel : label}</button>;
}
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const colors = ["#087F8C", "#123B40", "#E8A34B", "#5B7C8D", "#8C5B08"];
  const c = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return <div style={{ width: size, height: size, background: c }} className="rounded-full flex items-center justify-center text-white font-black shrink-0" aria-hidden>{(name || "؟").trim()[0]}</div>;
}
