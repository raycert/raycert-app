function getInitial(nickname: string): string {
  return nickname.trim().charAt(0).toUpperCase() || "?";
}

export function AvatarChip({ nickname, size = "lg" }: { nickname: string; size?: "md" | "lg" }) {
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-heading font-extrabold text-primary ${
        size === "lg" ? "size-16 text-2xl" : "size-10 text-base"
      }`}
    >
      {getInitial(nickname)}
    </div>
  );
}
