import { SignUp } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-background p-6">
      <SignUp />
    </main>
  );
}
