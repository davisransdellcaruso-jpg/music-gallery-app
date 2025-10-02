import { useState } from "react";

export default function TestEmailPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("Test Email from Wavis 🎶");
  const [htmlContent, setHtmlContent] = useState("<p>Hello from Brevo + Next.js!</p>");
  const [status, setStatus] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Sending...");

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, htmlContent }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus("✅ Email sent successfully!");
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setStatus(`❌ Request failed: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Test Email Sender</h1>
      <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "400px" }}>
        <input
          type="email"
          placeholder="Recipient email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          required
          style={{ padding: "0.5rem" }}
        />
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          style={{ padding: "0.5rem" }}
        />
        <textarea
          placeholder="HTML Content"
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          rows={5}
          style={{ padding: "0.5rem" }}
        />
        <button type="submit" style={{ padding: "0.75rem", background: "#4b2a6f", color: "white", border: "none", borderRadius: "6px" }}>
          Send Email
        </button>
      </form>

      {status && <p style={{ marginTop: "1rem" }}>{status}</p>}
    </div>
  );
}
