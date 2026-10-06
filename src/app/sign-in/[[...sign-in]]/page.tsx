import { SignIn } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-background p-6">
      <SignIn />
    </main>
  );
}
