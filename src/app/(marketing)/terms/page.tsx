import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions for using Meaningful Career Academy.",
};

export default function TermsPage() {
  return (
    <article className="prose prose-neutral mx-auto max-w-3xl px-4 py-14 dark:prose-invert">
      <h1>Terms of Service</h1>
      <p className="lead">
        These terms govern your use of Meaningful Career Academy (&ldquo;MCA&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account or purchasing
        any program, resource, or service, you agree to these terms.
      </p>

      <h2>1. Accounts</h2>
      <p>
        You are responsible for the accuracy of the information you provide and for
        keeping your login credentials secure. You must be legally able to enter
        into these terms in your jurisdiction.
      </p>

      <h2>2. Purchases &amp; access</h2>
      <p>
        Paid programs and resources are unlocked after your payment is verified.
        Access is granted to you personally and may not be shared, resold, or
        redistributed. We may revoke access for misuse.
      </p>

      <h2>3. Acceptable use</h2>
      <p>
        You agree not to misuse the platform, attempt to access other users&rsquo;
        data, or interfere with the service. Content is provided for your personal
        learning and career development.
      </p>

      <h2>4. Content &amp; intellectual property</h2>
      <p>
        All course materials, e-books, and resources remain the property of MCA or
        its mentors. You receive a limited, non-transferable licence to use them
        for personal learning.
      </p>

      <h2>5. Changes</h2>
      <p>
        We may update these terms from time to time. Continued use after changes
        take effect constitutes acceptance of the updated terms.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions about these terms? Reach us through the{" "}
        <a href="/contact">contact page</a>.
      </p>

      <p>
        <em>This page is a general template and should be reviewed by legal counsel
        before public launch.</em>
      </p>
    </article>
  );
}
