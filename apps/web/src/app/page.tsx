"use client";

import {
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { DashboardSummary } from "../chess/components/dashboard/DashboardSummary";

export default function Home(): React.JSX.Element {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">Chess</h1>
      <p className="text-gray-500 mb-8">Play chess online with friends</p>

      <SignedOut>
        <p className="text-gray-600 text-lg">
          Sign in to start playing and track your progress.
        </p>
      </SignedOut>

      <SignedIn>
        <DashboardSummary />
      </SignedIn>
    </main>
  );
}
