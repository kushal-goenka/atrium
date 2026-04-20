"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/users";

/**
 * Records that the current user copied the install snippet for a plugin.
 *
 * This is an "intent to install" signal. The authoritative install event
 * happens when a client fetches the artifact at
 * `/mkt/plugins/<slug>/<version>.tar.gz` (ships in v0.2); that call writes
 * an Install row too with clientType reflecting the User-Agent.
 *
 * Fire-and-forget — failures are swallowed. Never throws back to the UI.
 */
export async function recordInstallIntentAction(
  slug: string,
  version: string,
  clientType: string = "web-copy",
): Promise<void> {
  try {
    const user = await currentUser();
    const plugin = await prisma.plugin.findFirst({
      where: { slug },
      select: { id: true },
    });
    if (!plugin) return;

    // Ensure a User row exists for the mock identity so the Install FK holds.
    await prisma.user.upsert({
      where: { email: user.email },
      create: { id: user.id, email: user.email, name: user.name },
      update: { name: user.name },
    });

    await prisma.install.create({
      data: {
        userId: user.id,
        pluginId: plugin.id,
        version,
        clientType,
      },
    });
  } catch {
    /* silent */
  }
}
