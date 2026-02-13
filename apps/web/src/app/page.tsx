"use client";

import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";

export default function Home(): React.JSX.Element {
  const { user } = useUser();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">Chess</h1>
      <p className="text-gray-500 mb-8">Play chess online with friends</p>

      <SignedOut>
        <SignInButton mode="modal">
          <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold cursor-pointer">
            Sign In to Play
          </button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <div className="text-gray-700">
              <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-gray-500">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
          <Link
            href="/multiplayer"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
          >
            Play Multiplayer
          </Link>
        </div>
      </SignedIn>
    </main>
  );
}
