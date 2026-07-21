import { redirect } from "next/navigation";

/** Legacy path now is the home command center. */
export default function LegacyCockpitRedirect() {
  redirect("/");
}
