import { redirect } from "next/navigation";

import { upstream } from "@/lib/auth/upstream";
import type { Baby } from "@/lib/api/types";

export default async function ChatIndex() {
  const babies = await upstream<Baby[] | { results: Baby[] }>("/api/v1/babies/");
  const babyList = Array.isArray(babies) ? babies : babies.results;
  if (babyList.length === 0) {
    redirect("/setup");
  }

  // Create a new empty conversation and redirect.
  let conv: { id: string };
  try {
    conv = await upstream<{ id: string }>("/api/v1/chat/conversations", {
      method: "POST",
      body: JSON.stringify({ title: "" }),
    });
  } catch {
    redirect("/dashboard");
  }

  redirect(`/chat/${conv.id}`);
}
