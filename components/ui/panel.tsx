import { cn } from "@/lib/utils";

export function Panel({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={cn("glass rounded-[22px] p-4 sm:rounded-[28px] sm:p-6", className)}>{children}</section>;
}
