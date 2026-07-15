import { cn } from "@/lib/utils";

export function Card({
  className,
  interactive,
  highlighted,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass rounded-lg",
        interactive && "glass-hover hover:scale-[1.02]",
        highlighted && "border-accent/20 shadow-border-glow",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pb-2", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-display text-lg font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-2", className)} {...props} />;
}
