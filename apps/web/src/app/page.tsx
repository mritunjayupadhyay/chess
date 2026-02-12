import Link from "next/link";

export default function Home(): React.JSX.Element {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">Chess</h1>
      <p className="text-gray-500 mb-8">Play chess online with friends</p>
      <Link
        href="/multiplayer"
        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
      >
        Play Multiplayer
      </Link>
    </main>
  );
}
