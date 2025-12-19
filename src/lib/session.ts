import { cookies } from "next/headers";

export async function getActiveOrganizationId(): Promise<number> {
  const cookieStore = await cookies();
  const orgId = cookieStore.get("activeOrganizationId")?.value;

  if (!orgId) {
    throw new Error(
      "No hay una organización active. Selecciona una organización."
    );
  }

  const parsedId = parseInt(orgId, 10);

  if (isNaN(parsedId)) {
    throw new Error("El ID de la organización en la sesión es inválido.");
  }

  return parsedId;
}
