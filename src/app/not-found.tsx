import Link from "next/link";
export default function NotFound() {
  return (
    <main className="error-page">
      <h1>This little page drifted away.</h1>
      <Link className="button primary" href="/">
        Back to our sky
      </Link>
    </main>
  );
}
