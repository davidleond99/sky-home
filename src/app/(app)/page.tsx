import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/session";

export default async function HomePage() {
  const user = await requireUser();
  return <PageHeader title={`Hola, ${user.name.split(" ")[0]}`} description="Resumen del hogar" />;
}
