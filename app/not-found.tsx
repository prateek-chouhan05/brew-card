import Link from "next/link";

export default function NotFound() {
  return (
    <section className="view">
      <div className="empty">
        <h3>That recipe isn&apos;t here</h3>
        <p>It may have been renamed. Find it from the recipe list.</p>
        <div className="acts"><Link href="/" className="more">Browse recipes</Link></div>
      </div>
    </section>
  );
}
