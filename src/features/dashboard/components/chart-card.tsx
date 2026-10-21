import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ChartCard({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("gap-[18px] [--card-spacing:--spacing(5.5)]", className)}>
      <CardHeader className="gap-0.5">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription className="text-[13px]">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  );
}
