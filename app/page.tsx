import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";

export default async function RootPage() {
  const session = await getSession();

  if (session.ok) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}