"use client";

import {
  CheckCircle2,
  CircleAlert,
  Info,
  LoaderCircle,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type AdminNoticeState =
  | "pending"
  | "success"
  | "warning"
  | "error";

export type AdminNoticeInput = {
  title: string;
  message?: string;
};

type AdminNotice = AdminNoticeInput & {
  id: string;
  state: AdminNoticeState;
};

type AdminNoticeEvent =
  | { action: "upsert"; notice: AdminNotice }
  | { action: "dismiss"; id: string };

const EVENT_NAME = "octalve:admin-notice";
const MAX_NOTICES = 4;

function noticeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `notice-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emit(detail: AdminNoticeEvent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AdminNoticeEvent>(EVENT_NAME, { detail }));
}

function upsert(
  state: AdminNoticeState,
  input: AdminNoticeInput,
  id = noticeId(),
) {
  emit({ action: "upsert", notice: { id, state, ...input } });
  return id;
}

export const adminNotice = {
  pending(input: AdminNoticeInput, id?: string) {
    return upsert("pending", input, id);
  },
  success(id: string, input: AdminNoticeInput) {
    return upsert("success", input, id);
  },
  warning(id: string, input: AdminNoticeInput) {
    return upsert("warning", input, id);
  },
  error(id: string, input: AdminNoticeInput) {
    return upsert("error", input, id);
  },
  dismiss(id: string) {
    emit({ action: "dismiss", id });
  },
};

const treatment: Record<
  AdminNoticeState,
  { icon: typeof Info; tile: string; iconClass: string }
> = {
  pending: {
    icon: LoaderCircle,
    tile: "bg-blue-50",
    iconClass: "animate-spin text-[#0064E0] motion-reduce:animate-none",
  },
  success: {
    icon: CheckCircle2,
    tile: "bg-emerald-50",
    iconClass: "text-emerald-700",
  },
  warning: {
    icon: TriangleAlert,
    tile: "bg-amber-50",
    iconClass: "text-amber-700",
  },
  error: {
    icon: CircleAlert,
    tile: "bg-red-50",
    iconClass: "text-red-700",
  },
};

export function AdminNotificationProvider() {
  const [notices, setNotices] = useState<AdminNotice[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    function clearTimer(id: string) {
      const timer = timers.current.get(id);
      if (timer) clearTimeout(timer);
      timers.current.delete(id);
    }

    function dismiss(id: string) {
      clearTimer(id);
      setNotices((current) => current.filter((notice) => notice.id !== id));
    }

    function onNotice(event: Event) {
      const detail = (event as CustomEvent<AdminNoticeEvent>).detail;
      if (!detail) return;

      if (detail.action === "dismiss") {
        dismiss(detail.id);
        return;
      }

      const next = detail.notice;
      clearTimer(next.id);
      setNotices((current) => {
        const withoutCurrent = current.filter((notice) => notice.id !== next.id);
        return [next, ...withoutCurrent].slice(0, MAX_NOTICES);
      });

      if (next.state === "success" || next.state === "warning") {
        const delay = next.state === "success" ? 4500 : 7000;
        timers.current.set(
          next.id,
          setTimeout(() => dismiss(next.id), delay),
        );
      }
    }

    window.addEventListener(EVENT_NAME, onNotice);
    const activeTimers = timers.current;
    return () => {
      window.removeEventListener(EVENT_NAME, onNotice);
      for (const timer of activeTimers.values()) clearTimeout(timer);
      activeTimers.clear();
    };
  }, []);

  return (
    <div
      aria-label="Admin action notifications"
      className="pointer-events-none fixed inset-x-3 top-3 z-40 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[380px] sm:items-stretch"
    >
      {notices.map((notice) => {
        const style = treatment[notice.state];
        const Icon = style.icon;
        return (
          <div
            key={notice.id}
            role={notice.state === "error" ? "alert" : "status"}
            aria-live={notice.state === "error" ? "assertive" : "polite"}
            aria-atomic="true"
            className="pointer-events-auto w-full rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,.14)] motion-safe:transition-all motion-reduce:transition-none"
          >
            <div className="flex items-start gap-3">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${style.tile}`}>
                <Icon className={`h-[18px] w-[18px] ${style.iconClass}`} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-950">{notice.title}</p>
                {notice.message ? (
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {notice.message}
                  </p>
                ) : null}
              </div>
              {notice.state !== "pending" ? (
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => adminNotice.dismiss(notice.id)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 motion-reduce:transition-none"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
