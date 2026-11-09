import { useState } from "react";
import "./TrackApplication.css";

const API_URL = "http://localhost:5000/api/applications/track";

function TrackApplication() {
  const [email, setEmail] = useState("");
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setApplications([]);
    setSearched(false);

    try {
      const response = await fetch(
        `${API_URL}?email=${encodeURIComponent(email.trim().toLowerCase())}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not check applications.");
      }

      setApplications(data.applications || []);
      setSearched(true);

      if (!data.applications?.length) {
        setMessage("No applications found for this email address.");
      }
    } catch (error) {
      setMessage(error.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="tracker-page">
      <section className="tracker-card">
        <h1>Track Your Application</h1>
        <p>
          Enter the email address you used when applying for a job.
        </p>

        <form onSubmit={handleSubmit} className="tracker-form">
          <label htmlFor="tracker-email">Email Address</label>
          <input
            id="tracker-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Checking..." : "Check Status"}
          </button>
        </form>

        {message && <p role="status">{message}</p>}

        {searched && applications.length > 0 && (
          <section className="tracker-results">
            <h2>Your Applications</h2>

            {applications.map((application) => (
              <article className="tracker-result" key={application.id}>
                <h3>{application.jobTitle}</h3>
                <p>
                  <strong>Company:</strong>{" "}
                  {application.company || "Not specified"}
                </p>
                <p>
                  <strong>Location:</strong>{" "}
                  {application.location || "Not specified"}
                </p>
                <p>
                  <strong>Applied on:</strong>{" "}
                  {formatDate(application.appliedAt)}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span className={`tracker-status ${(application.status || "Pending").toLowerCase()}`}>
                    {application.status || "Pending"}
                  </span>
                </p>
              </article>
            ))}
          </section>
        )}

        <p className="tracker-note">
          Your application status changes when the administrator updates it.
        </p>

        <a href="/">Back to Home</a>
      </section>
    </main>
  );
}

export default TrackApplication;