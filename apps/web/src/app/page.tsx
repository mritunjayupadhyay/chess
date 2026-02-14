"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/nextjs";
import { DashboardSummary } from "../chess/components/dashboard/DashboardSummary";

export default function Home(): React.JSX.Element {
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
        <DashboardSummary />
      </SignedIn>
    </main>
  );
}
