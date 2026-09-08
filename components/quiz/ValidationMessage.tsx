import { AlertTriangleIcon } from "lucide-react";

export function ValidationMessage({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;

  return (
    <div
      role="alert"
      className="flex flex-col gap-1 rounded-lg border border-error-100 bg-error-100/60 px-3.5 py-2.5 text-[12.5px] text-error-600"
    >
      {messages.map((message) => (
        <div key={message} className="flex items-center gap-2">
          <AlertTriangleIcon className="size-3.5 shrink-0" />
          <span>{message}</span>
        </div>
      ))}
    </div>
  );
}
