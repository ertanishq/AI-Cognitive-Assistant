import Link from "next/link"

export default function NotFound() {
  return (
    <main className="not-found-page">
      <p className="eyebrow">Page not found</p>
      <h1>We couldn&apos;t find that page.</h1>
      <p>Return to the home page to find the right place to start.</p>
      <Link className="button button--primary" href="/">
        Go to home
      </Link>
    </main>
  )
}
