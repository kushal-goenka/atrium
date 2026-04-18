import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser, findUser } from "@/lib/users";
import { UploadSkillForm } from "./form";

export const metadata = { title: "Upload a skill" };
export const dynamic = "force-dynamic";

export default async function UploadSkillPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const target = findUser(id);
  if (!target) notFound();

  const me = await currentUser();
  if (me.id !== target.id) {
    // Redirect to your own profile upload — skills are contributed by a user,
    // not uploaded on someone else's behalf.
    redirect(`/users/${me.id}/upload`);
  }

  return (
    <div>
      <Link
        href={`/users/${target.id}`}
        className="inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg-muted)]"
      >
        ← Back to your profile
      </Link>

      <div className="mt-4 max-w-[720px]">
        <p className="text-[11.5px] font-mono uppercase tracking-[0.08em] text-[color:var(--color-fg-subtle)]">
          Contribute
        </p>
        <h1 className="mt-2 text-[24px] font-semibold tracking-tight">Upload a skill</h1>
        <p className="mt-1 text-[13.5px] text-[color:var(--color-fg-muted)]">
          Publish a SKILL.md you authored. It lands in quarantine, a curator reviews it, then it
          appears in the catalog attributed to you. You stay the owner — versions are your call.
        </p>

        <UploadSkillForm targetUserId={target.id} uploaderName={target.name} />
      </div>
    </div>
  );
}
