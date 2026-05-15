import { cn } from "@/lib/utils";

export function Panel({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={cn("glass rounded-[28px] p-5 sm:p-6", className)}>{children}</section>;
}
