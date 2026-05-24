import Link from "next/link";
import { Button } from "~/components/ui/button";
import messages from "~/messages/zh-cn.json";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        {messages.Errors.notFoundTitle}
      </h1>
      <p className="mt-3 text-muted-foreground">
        {messages.Errors.notFoundDescription}
      </p>
      <div className="mt-6">
        <Button asChild>
          <Link href="/">{messages.Errors.returnHome}</Link>
        </Button>
      </div>
    </main>
  );
}
