export type AdminActionFeedback = {
  state: "idle" | "pending" | "success" | "error";
  message: string | null;
};

export function AdminActionStatus({
  feedback,
  className = "",
}: {
  feedback: AdminActionFeedback;
  className?: string;
}) {
  if (!feedback.message || feedback.state === "idle") return null;

  const tone =
    feedback.state === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : feedback.state === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <p
      role={feedback.state === "error" ? "alert" : "status"}
      aria-live={feedback.state === "error" ? "assertive" : "polite"}
      className={`rounded-xl border px-3 py-2 text-xs font-medium ${tone} ${className}`.trim()}
    >
      {feedback.message}
    </p>
  );
}
