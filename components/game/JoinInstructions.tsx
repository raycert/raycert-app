export function JoinInstructions({
  text = "Quét QR hoặc nhập PIN để tham gia",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <p className={`text-[17px] font-medium leading-6.5 text-white/80 ${className ?? ""}`}>
      {text}
    </p>
  );
}
