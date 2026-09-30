import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container max-w-md py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Nothing here</h1>
      <Link href="/" className="btn-dark mt-8">Back to the pot</Link>
    </div>
  );
}
