import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Meaningful Career Academy collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-neutral mx-auto max-w-3xl px-4 py-14 dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p className="lead">
        This policy explains what personal data Meaningful Career Academy
        (&ldquo;MCA&rdquo;) collects and how we use it.
      </p>

      <h2>1. Data we collect</h2>
      <ul>
        <li>Account details you provide: name, email, and optional profile info.</li>
        <li>Payment submission details you enter for manual verification.</li>
        <li>Usage data such as enrollments, progress, and questions you ask.</li>
      </ul>

      <h2>2. How we use it</h2>
      <p>
        We use your data to provide the service — granting access to purchases,
        tracking your learning progress, answering your questions, and supporting
        your account. We do not sell your personal data.
      </p>

      <h2>3. Storage &amp; security</h2>
      <p>
        Data is stored with our infrastructure providers under row-level security.
        Uploaded files (such as payment screenshots) are kept in private storage
        accessible only to you and authorised administrators.
      </p>

      <h2>4. Your choices</h2>
      <p>
        You can update your profile from your dashboard settings. To request
        deletion of your account and associated data, contact us.
      </p>

      <h2>5. Contact</h2>
      <p>
        For privacy questions, reach us through the{" "}
        <a href="/contact">contact page</a>.
      </p>

      <p>
        <em>This page is a general template and should be reviewed by legal counsel
        before public launch.</em>
      </p>
    </article>
  );
}
