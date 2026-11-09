import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './App.css'

import TrackApplication from './TrackApplication'
import Login from './Login'
import Register from './Register'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = location.pathname.replace(/\/+$/, '') || '/'

  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [jobType, setJobType] = useState('All')
  const [selectedJob, setSelectedJob] = useState(null)

  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [applicationLoading, setApplicationLoading] = useState(false)
  const [applicationMessage, setApplicationMessage] = useState('')
  const [applicationError, setApplicationError] = useState('')

  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem('userToken')),
  )

  const [applicationForm, setApplicationForm] = useState({
    applicantName: '',
    email: '',
    phone: '',
    resume: null,
    coverLetter: '',
  })

  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem('userToken')))
  }, [location.pathname])

  useEffect(() => {
    function checkLoginStatus() {
      setIsLoggedIn(Boolean(localStorage.getItem('userToken')))
    }

    window.addEventListener('storage', checkLoginStatus)

    return () => {
      window.removeEventListener('storage', checkLoginStatus)
    }
  }, [])

  async function fetchJobs() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('http://localhost:5000/api/jobs')
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load jobs.')
      }

      const jobs = Array.isArray(data)
        ? data
        : Array.isArray(data.jobs)
          ? data.jobs
          : Array.isArray(data.opportunities)
            ? data.opportunities
            : []

      setOpportunities(jobs)
    } catch (err) {
      setError(
        err.message ||
          'Could not load job listings. Please make sure the backend server is running.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  if (currentPath === '/login') {
    return <Login />
  }

  if (currentPath === '/register') {
    return <Register />
  }

  if (
    currentPath === '/track-application' ||
    currentPath === '/track'
  ) {
    return <TrackApplication />
  }

  const filteredJobs = opportunities.filter((job) => {
    const searchText = [
      job.title,
      job.company,
      job.location,
      job.domain,
      job.category,
      job.type,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const jobCategory = job.domain || job.category || 'Other'

    return (
      searchText.includes(search.trim().toLowerCase()) &&
      (category === 'All' || jobCategory === category) &&
      (jobType === 'All' || job.type === jobType)
    )
  })

  function resetFilters() {
    setSearch('')
    setCategory('All')
    setJobType('All')
  }

  function resetApplicationForm() {
    setApplicationForm({
      applicantName: '',
      email: '',
      phone: '',
      resume: null,
      coverLetter: '',
    })
  }

  function openJob(job) {
    setSelectedJob(job)
    setShowApplicationForm(false)
    setApplicationMessage('')
    setApplicationError('')
    resetApplicationForm()
  }

  function closeJob() {
    if (applicationLoading) return

    setSelectedJob(null)
    setShowApplicationForm(false)
    setApplicationMessage('')
    setApplicationError('')
  }

  function handleLogout() {
    localStorage.removeItem('userToken')
    localStorage.removeItem('userInfo')
    setIsLoggedIn(false)
    navigate('/', { replace: true })
  }

  function handleApplicationChange(event) {
    const { name, value } = event.target

    setApplicationForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  function handleResumeChange(event) {
    const file = event.target.files?.[0] || null

    if (!file) {
      setApplicationForm((previous) => ({
        ...previous,
        resume: null,
      }))
      return
    }

    if (
      file.type !== 'application/pdf' ||
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      setApplicationError('Please select a PDF file.')
      event.target.value = ''
      setApplicationForm((previous) => ({
        ...previous,
        resume: null,
      }))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setApplicationError('The PDF resume must be 5 MB or smaller.')
      event.target.value = ''
      setApplicationForm((previous) => ({
        ...previous,
        resume: null,
      }))
      return
    }

    setApplicationError('')
    setApplicationForm((previous) => ({
      ...previous,
      resume: file,
    }))
  }

  async function submitApplication(event) {
    event.preventDefault()

    if (applicationLoading) return

    const userToken = localStorage.getItem('userToken')

    if (!userToken) {
      navigate('/login', {
        state: {
          from: { pathname: '/' },
        },
      })
      return
    }

    if (!selectedJob?._id) {
      setApplicationError('Please select a valid job first.')
      return
    }

    if (!applicationForm.resume) {
      setApplicationError('Please upload your PDF resume.')
      return
    }

    try {
      setApplicationLoading(true)
      setApplicationError('')
      setApplicationMessage('')

      const formData = new FormData()
      formData.append('jobId', selectedJob._id)
      formData.append(
        'applicantName',
        applicationForm.applicantName.trim(),
      )
      formData.append('email', applicationForm.email.trim())
      formData.append('phone', applicationForm.phone.trim())
      formData.append(
        'coverLetter',
        applicationForm.coverLetter.trim(),
      )
      formData.append('resume', applicationForm.resume)

      const response = await fetch(
        'http://localhost:5000/api/applications',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          body: formData,
        },
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('userToken')
          localStorage.removeItem('userInfo')
          setIsLoggedIn(false)
          throw new Error(
            'Your login session may have expired. Please log in again.',
          )
        }

        throw new Error(data.message || 'Failed to submit application.')
      }

      setApplicationMessage(
        data.message || 'Your application was submitted successfully!',
      )

      resetApplicationForm()
      setShowApplicationForm(false)
    } catch (err) {
      setApplicationError(
        err.message || 'Something went wrong. Please try again.',
      )
    } finally {
      setApplicationLoading(false)
    }
  }

  return (
    <div className="app" id="home">
      <header className="navbar">
        <Link className="brand" to="/">
          <span className="brand-icon">O</span>
          Opportunity Hub<span className="brand-dot">.</span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Home</Link>
          <a href="/jobs#opportunities">Find Jobs</a>
          <a href="/jobs#about">About Us</a>
          <Link to="/track-application">Track Application</Link>

          {isLoggedIn ? (
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>

        <a className="nav-button" href="/jobs#opportunities">
          Explore Jobs <span>✦</span>
        </a>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="status-dot"></span>
              YOUR NEXT OPPORTUNITY STARTS HERE
            </div>

            <h1>
              Discover Opportunities.
              <br />
              <span>Build Your Future.</span>
            </h1>

            <p className="hero-description">
              Explore internships and job opportunities in one place.
              Find the right opportunity, showcase your skills, and take
              the next step toward your dream career.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#opportunities">
                Find Opportunities <span>→</span>
              </a>
              <a className="secondary-button" href="#about">
                Learn More
              </a>
            </div>

            <div className="hero-stats">
              <div>
                <strong>Internships</strong>
                <span>Build experience</span>
              </div>
              <div>
                <strong>Full-time Jobs</strong>
                <span>Grow your career</span>
              </div>
              <div>
                <strong>New Skills</strong>
                <span>Unlock potential</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-glow"></div>
            <div className="visual-ring ring-one"></div>
            <div className="visual-ring ring-two"></div>

            <div className="visual-center">
              <span className="rocket">👩🏻‍🎓</span>
              <h3>Your future awaits</h3>
              <p>Discover. Grow. Achieve.</p>
            </div>

            <div className="floating-card float-top">
              <span className="float-icon purple">💼</span>
              <div>
                <strong>Career Growth</strong>
                <small>Make your next move</small>
              </div>
            </div>

            <div className="floating-card float-bottom">
              <span className="float-icon green">🌟</span>
              <div>
                <strong>New Beginnings</strong>
                <small>Start something great</small>
              </div>
            </div>
          </div>
        </section>

        <section className="opportunities section" id="opportunities">
          <div className="section-heading">
            <div>
              <span className="section-label">OPPORTUNITIES FOR YOU</span>
              <h2>Find Your Next Opportunity</h2>
              <p>
                Explore internship and job opportunities from Opportunity Hub.
              </p>
            </div>

            <span className="result-count">
              {filteredJobs.length} results
            </span>
          </div>

          <div className="search-panel">
            <label className="search-field">
              <span className="search-icon">⌕</span>
              <input
                type="search"
                placeholder="Search job title, company or location..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <select
              aria-label="Filter by domain"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="All">All Domains</option>
              <option value="Technology">Technology</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Data">Data</option>
              <option value="HR">Human Resources</option>
            </select>

            <select
              aria-label="Filter by job type"
              value={jobType}
              onChange={(event) => setJobType(event.target.value)}
            >
              <option value="All">All Job Types</option>
              <option value="Internship">Internship</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
            </select>

            <button
              className="reset-button"
              type="button"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>

          {loading && (
            <div className="empty-state">
              <h3>Loading opportunities...</h3>
              <p>Please wait while we fetch the latest job listings.</p>
            </div>
          )}

          {error && !loading && (
            <div className="empty-state" role="alert">
              <span>⚠</span>
              <h3>Unable to load jobs</h3>
              <p>{error}</p>
              <button
                className="primary-button"
                type="button"
                onClick={fetchJobs}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="job-grid">
                {filteredJobs.map((job) => (
                  <article className="job-card" key={job._id}>
                    <div className="job-card-header">
                      <div className="company-icon">🏢</div>

                      <span
                        className={`job-type ${
                          job.type === 'Full-time' ? 'full-time' : ''
                        }`}
                      >
                        {job.type || 'Opportunity'}
                      </span>
                    </div>

                    <span className="job-category">
                      {job.domain || job.category || 'Other'}
                    </span>

                    <h3>{job.title || 'Untitled opportunity'}</h3>
                    <p className="company-name">
                      {job.company || 'Company not specified'}
                    </p>

                    <div className="job-details">
                      <span>📍 {job.location || 'Not specified'}</span>
                      <span>₹ {job.salary || 'Not specified'}</span>
                    </div>

                    <button
                      className="apply-button"
                      type="button"
                      onClick={() => openJob(job)}
                    >
                      View Details <span>→</span>
                    </button>
                  </article>
                ))}
              </div>

              {filteredJobs.length === 0 && (
                <div className="empty-state">
                  <span>⌕</span>
                  <h3>No opportunities found</h3>
                  <p>
                    {opportunities.length === 0
                      ? 'No active job listings are available yet.'
                      : 'Try a different search or reset your filters.'}
                  </p>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={resetFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <section className="about section" id="about">
          <span className="section-label">YOUR CAREER, YOUR FUTURE</span>
          <h2>Big dreams deserve great opportunities.</h2>
          <p>
            Opportunity Hub brings internships and job opportunities
            together in one place. Explore your options, develop your
            skills, and take the next step with confidence.
          </p>
          <a className="primary-button" href="#opportunities">
            Start Exploring <span>→</span>
          </a>
        </section>
      </main>

      <footer className="footer">
        <Link className="brand footer-brand" to="/">
          <span className="brand-icon">O</span>
          Opportunity Hub<span className="brand-dot">.</span>
        </Link>
        <p>Discover Opportunities. Build Your Future.</p>
        <span>© {new Date().getFullYear()} Opportunity Hub</span>
      </footer>

      {selectedJob && (
        <div
          className="modal-backdrop"
          onClick={closeJob}
          role="presentation"
        >
          <section
            className="job-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              aria-label="Close job details"
              onClick={closeJob}
              disabled={applicationLoading}
            >
              ×
            </button>

            <div className="company-icon modal-icon">🏢</div>

            <span className="job-category">
              {selectedJob.domain || selectedJob.category || 'Other'}
            </span>

            <h2 id="modal-title">{selectedJob.title}</h2>
            <p className="company-name">{selectedJob.company}</p>

            <div className="modal-details">
              <p>
                <strong>Type:</strong>{' '}
                {selectedJob.type || 'Not specified'}
              </p>
              <p>
                <strong>Location:</strong>{' '}
                {selectedJob.location || 'Not specified'}
              </p>
              <p>
                <strong>Experience:</strong>{' '}
                {selectedJob.experience || 'Not specified'}
              </p>
              <p>
                <strong>Salary / Stipend:</strong>{' '}
                {selectedJob.salary || 'Not specified'}
              </p>
              <p>
                <strong>Description:</strong>{' '}
                {selectedJob.description || 'No description provided.'}
              </p>

              {Array.isArray(selectedJob.requirements) &&
                selectedJob.requirements.length > 0 && (
                  <div>
                    <strong>Requirements:</strong>
                    <ul>
                      {selectedJob.requirements.map((requirement, index) => (
                        <li key={index}>{requirement}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {Array.isArray(selectedJob.skills) &&
                selectedJob.skills.length > 0 && (
                  <div>
                    <strong>Skills:</strong>
                    <p>{selectedJob.skills.join(', ')}</p>
                  </div>
                )}

              {selectedJob.deadline && (
                <p>
                  <strong>Application deadline:</strong>{' '}
                  {new Date(selectedJob.deadline).toLocaleDateString()}
                </p>
              )}

              {selectedJob.applicationLink && (
                <p>
                  <strong>Application link:</strong>{' '}
                  <a
                    href={selectedJob.applicationLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open company application page
                  </a>
                </p>
              )}
            </div>

            {!showApplicationForm && !applicationMessage && (
              <button
                className="primary-button modal-action"
                type="button"
                onClick={() => {
                  if (!localStorage.getItem('userToken')) {
                    navigate('/login', {
                      state: { from: { pathname: '/' } },
                    })
                    return
                  }

                  setApplicationError('')
                  setShowApplicationForm(true)
                }}
              >
                Apply Now <span>→</span>
              </button>
            )}

            {showApplicationForm && !applicationMessage && (
              <form
                className="application-form"
                onSubmit={submitApplication}
              >
                <h3>Apply for this position</h3>
                <p>
                  Applying for: <strong>{selectedJob.title}</strong>
                </p>

                <label htmlFor="applicantName">Full Name *</label>
                <input
                  id="applicantName"
                  name="applicantName"
                  type="text"
                  required
                  maxLength={100}
                  value={applicationForm.applicantName}
                  onChange={handleApplicationChange}
                  placeholder="Enter your full name"
                />

                <label htmlFor="applicantEmail">Email Address *</label>
                <input
                  id="applicantEmail"
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  value={applicationForm.email}
                  onChange={handleApplicationChange}
                  placeholder="you@example.com"
                />

                <label htmlFor="applicantPhone">Phone Number *</label>
                <input
                  id="applicantPhone"
                  name="phone"
                  type="tel"
                  required
                  maxLength={20}
                  value={applicationForm.phone}
                  onChange={handleApplicationChange}
                  placeholder="Enter your phone number"
                />

                <label htmlFor="resume">Upload Resume (PDF) *</label>
                <input
                  id="resume"
                  name="resume"
                  type="file"
                  accept=".pdf,application/pdf"
                  required
                  onChange={handleResumeChange}
                />

                <small>
                  Select a PDF resume. Maximum file size: 5 MB.
                  {applicationForm.resume
                    ? ` Selected: ${applicationForm.resume.name}`
                    : ''}
                </small>

                <label htmlFor="coverLetter">Cover Letter</label>
                <textarea
                  id="coverLetter"
                  name="coverLetter"
                  rows={5}
                  maxLength={5000}
                  value={applicationForm.coverLetter}
                  onChange={handleApplicationChange}
                  placeholder="Tell the employer why you are suitable for this job."
                />

                {applicationError && (
                  <p role="alert" className="application-error">
                    {applicationError}
                  </p>
                )}

                <button
                  className="primary-button modal-action"
                  type="submit"
                  disabled={applicationLoading}
                >
                  {applicationLoading
                    ? 'Submitting...'
                    : 'Submit Application'}
                </button>

                <button
                  className="secondary-button modal-action"
                  type="button"
                  disabled={applicationLoading}
                  onClick={() => {
                    setShowApplicationForm(false)
                    setApplicationError('')
                  }}
                >
                  Back to Job Details
                </button>
              </form>
            )}

            {applicationMessage && (
              <div className="application-success" role="status">
                <h3>Application Submitted!</h3>
                <p>{applicationMessage}</p>
              </div>
            )}

            <button
              className="secondary-button modal-action"
              type="button"
              onClick={closeJob}
              disabled={applicationLoading}
            >
              Close Details
            </button>
          </section>
        </div>
      )}
    </div>
  )
}

export default App