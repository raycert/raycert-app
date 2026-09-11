import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 bg-background px-6 py-24 text-center">
      <div className="flex flex-col items-center gap-3">
        <h1 className="font-heading text-[40px] font-extrabold leading-12 text-heading">
          RayCert
        </h1>
        <p className="text-[17px] font-medium leading-6.5 text-body">
          Train. Engage. Certify.
        </p>
      </div>

      <Button size="lg" asChild>
        <Link href="/join">Join Game</Link>
      </Button>

      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <Button variant="secondary" asChild>
          <Link href="/login">Trainer Login</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/host/123456/lobby">Host Lobby</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/join/123456">Join via Link (mock)</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/play/123456?nickname=Demo">Waiting Room (mock)</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/design-system">/design-system</Link>
        </Button>
      </div>
    </div>
  );
}
