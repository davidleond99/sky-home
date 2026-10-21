import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/features/auth/actions";
import { requireUser } from "@/lib/session";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Tarjeta del usuario al pie del sidebar, con botón de cerrar sesión. */
export async function UserCard() {
  const user = await requireUser();

  return (
    <div className="glass-inset flex items-center gap-2.5 rounded-[14px] p-2.5">
      <div className="bg-accent text-primary grid size-9 shrink-0 place-items-center rounded-[10px] text-[13px] font-semibold">
        {initials(user.name)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-[13px] font-medium">{user.name}</span>
        <span className="text-muted-foreground truncate text-[11px]">{user.email}</span>
      </div>
      <form action={signOut}>
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="text-muted-foreground hover:bg-tint-neg hover:text-destructive"
        >
          <LogOut className="size-[17px]" />
        </Button>
      </form>
    </div>
  );
}

/** Iniciales en la barra superior del móvil; abre un menú con «Cerrar sesión». */
export async function MobileUserMenu() {
  const user = await requireUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={user.name}
          className="bg-accent text-primary grid size-[34px] place-items-center rounded-[10px] text-xs font-semibold"
        >
          {initials(user.name)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span>{user.name}</span>
          <span className="text-muted-foreground text-xs font-normal">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut />
              Cerrar sesión
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
