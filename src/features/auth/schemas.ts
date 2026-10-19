import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Correo no válido").trim().toLowerCase(),
  password: z.string().min(1, "Escribe la contraseña"),
});

export type SignInInput = z.infer<typeof signInSchema>;
