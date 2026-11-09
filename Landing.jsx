import { Link } from 'react-router-dom'
import './Landing.css'

function Landing() {
  return (
    <div className="landing-page">
      <header className="landing-navbar">
        <Link to="/" className="landing-brand">
          <span className="landing-logo">O</span>
          Opportunity Hub<span className="landing-dot">.</span>
        </Link>
      </header>

      <main className="landing-main">
        <section className="landing-heading">
          <span className="landing-badge">
            ✨ YOUR FUTURE STARTS HERE
          </span>

          <h1>Welcome to Opportunity Hub</h1>

          <p>
            Discover Opportunities. Build Your Future.
            Find your path and make your next move.
          </p>
        </section>

        <section className="landing-cards">
          <article className="landing-card user-card">
            <div className="landing-card-icon">👩🏻‍🎓</div>

            <h2>For Students &amp; Job Seekers</h2>

            <p>
              Discover internships and job opportunities,
              apply for positions, showcase your skills,
              and take the next step toward your dream career.
            </p>

            <Link className="landing-button user-button" to="/login">
              User Login <span>→</span>
            </Link>

            <Link className="landing-button user-outline" to="/register">
              Create User Account
            </Link>
          </article>

          <article className="landing-card admin-card">
            <div className="landing-card-icon">⚙️</div>

            <h2>For Administrators</h2>

            <p>
              Access the administration panel to manage
              opportunities, publish job listings, and
              review applications with ease.
            </p>

            <Link
              className="landing-button admin-button"
              to="/admin/login"
            >
              Admin Login <span>→</span>
            </Link>
          </article>
        </section>

        <section className="landing-footer">
          <h3>Your next chapter starts here. </h3>

          <p>
            Discover Opportunities. Build Your Future.
          </p>

          <p>
            © {new Date().getFullYear()} Opportunity Hub.
            All rights reserved.
          </p>
        </section>
      </main>
    </div>
  )
}

export default Landing