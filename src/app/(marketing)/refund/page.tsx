import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Meaningful Career Academy's policy on refunds for programs and resources.",
};

export default function RefundPage() {
  return (
    <article className="prose prose-neutral mx-auto max-w-3xl px-4 py-14 dark:prose-invert">
      <h1>Refund Policy</h1>
      <p className="lead">
        We want you to be confident in your purchase. This policy explains when
        refunds are available.
      </p>

      <h2>1. Digital resources &amp; e-books</h2>
      <p>
        Because digital resources are delivered instantly and cannot be returned,
        purchases are generally non-refundable once access has been granted —
        except where required by law or in cases of a proven technical fault that
        we cannot resolve.
      </p>

      <h2>2. Programs &amp; courses</h2>
      <p>
        If you have not accessed any lessons, you may request a refund within 7
        days of purchase. Once significant course content has been accessed,
        refunds are assessed case by case.
      </p>

      <h2>3. Payment verification issues</h2>
      <p>
        Payments are verified manually. If your payment was charged but access was
        not granted, contact us with your transaction ID and we will resolve it or
        refund the amount.
      </p>

      <h2>4. How to request a refund</h2>
      <p>
        Reach us through the <a href="/contact">contact page</a> with your order
        details and reason. We aim to respond within 3 business days.
      </p>

      <p>
        <em>This page is a general template and should be reviewed by legal counsel
        before public launch.</em>
      </p>
    </article>
  );
}
