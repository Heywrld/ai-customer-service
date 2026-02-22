import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <img src="/icons/han-icon-white.svg" alt="Han" className="h-10 w-auto mx-auto mb-3" />
          <p className="text-slate-400 text-sm">AI customer service for Nigerian businesses</p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
