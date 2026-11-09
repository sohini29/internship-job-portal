import { useEffect, useState } from 'react'
import './Admin.css'

const API_URL = 'http://localhost:5000/api/jobs'
const AUTH_URL = 'http://localhost:5000/api/auth/login'
const APPLICATIONS_URL = 'http://localhost:5000/api/applications'

const emptyForm = {
  title: '',
  company: '',
  location: '',
  type: 'Internship',
  category: 'Technology',
  salary: '',
  description: '',
  requirements: '',
  skills: '',
  applicationLink: '',
  deadline: '',
  postedBy: 'Admin',
}

function Admin() {
  const [token, setToken] = useState(
    () => localStorage.getItem('careerconnect_admin_token') || '',
  )
  const [username, setUsername] = useState(
    () => localStorage.getItem('careerconnect_admin_username') || '',
  )
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  })
  const [loginLoading, setLoginLoading] = useState(false)

  const [jobs, setJobs] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [applications, setApplications] = useState([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [applicationsError, setApplicationsError] = useState('')
  const [showApplications, setShowApplications] = useState(false)

  async function loadJobs() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(API_URL)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not load jobs.')
      }

      setJobs(data.jobs || [])
    } catch (err) {
      setError(err.message || 'Could not connect to the backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  function handleLoginChange(event) {
    const { name, value } = event.target
    setLoginForm((previous) => ({ ...previous, [name]: value }))
  }

  async function handleLogin(event) {
    event.preventDefault()
    setLoginLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.')
      }

      localStorage.setItem('careerconnect_admin_token', data.token)
      localStorage.setItem('careerconnect_admin_username', data.username)

      setToken(data.token)
      setUsername(data.username)
      setLoginForm({ username: '', password: '' })
      setMessage('Login successful!')
      setError('')
    } catch (err) {
      setError(err.message || 'Could not connect to the backend.')
    } finally {
      setLoginLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('careerconnect_admin_token')
    localStorage.removeItem('careerconnect_admin_username')
    setToken('')
    setUsername('')
    setForm(emptyForm)
    setEditingId(null)
    setMessage('')
    setError('')
    setApplications([])
    setShowApplications(false)
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setMessage('')
    setError('')
  }

  function editJob(job) {
    setEditingId(job._id)
    setMessage('')
    setError('')

    setForm({
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      type: job.type || 'Internship',
      category: job.category || 'Technology',
      salary: job.salary || '',
      description: job.description || '',
      requirements: (job.requirements || []).join(', '),
      skills: (job.skills || []).join(', '),
      applicationLink: job.applicationLink || '',
      deadline: job.deadline
        ? new Date(job.deadline).toISOString().slice(0, 10)
        : '',
      postedBy: job.postedBy || 'Admin',
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function authorizedFetch(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json().catch(() => ({}))

    if (response.status === 401 || response.status === 403) {
      logout()
      throw new Error(
        'Your admin session expired. Please log in again.',
      )
    }

    if (!response.ok) {
      throw new Error(data.message || 'The request failed.')
    }

    return data
  }

  async function loadApplications() {
    try {
      setApplicationsLoading(true)
      setApplicationsError('')

      const data = await authorizedFetch(APPLICATIONS_URL)
      const list = Array.isArray(data)
        ? data
        : data.applications || []

      setApplications(list)
    } catch (err) {
      setApplicationsError(
        err.message || 'Could not load applications.',
      )
    } finally {
      setApplicationsLoading(false)
    }
  }

  async function updateApplicationStatus(applicationId, status) {
    try {
      await authorizedFetch(
        `${APPLICATIONS_URL}/${applicationId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      )

      setApplications((previous) =>
        previous.map((application) =>
          application._id === applicationId
            ? { ...application, status }
            : application,
        ),
      )

      setMessage('Application status updated successfully!')
      setApplicationsError('')
    } catch (err) {
      setApplicationsError(
        err.message || 'Could not update application status.',
      )
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    const payload = {
      ...form,
      requirements: form.requirements
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      skills: form.skills
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      deadline: form.deadline || null,
    }

    try {
      await authorizedFetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      setMessage(
        editingId
          ? 'Job updated successfully!'
          : 'New job added successfully!',
      )

      setForm(emptyForm)
      setEditingId(null)
      await loadJobs()
    } catch (err) {
      setError(err.message || 'Unable to save this job.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteJob(job) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${job.title}"?`,
    )

    if (!confirmed) return

    setMessage('')
    setError('')

    try {
      await authorizedFetch(`${API_URL}/${job._id}`, {
        method: 'DELETE',
      })

      setMessage('Job deleted successfully!')
      await loadJobs()
    } catch (err) {
      setError(err.message || 'Could not delete the job.')
    }
  }

  if (!token) {
    return (
      <div className="admin-page">
        <header className="admin-header">
          <a className="admin-brand" href="/">
            <span className="admin-brand-icon">O</span>
            Opportunity Hub<span className="admin-brand-dot">.</span>
          </a>
          <a className="admin-home-link" href="/">
            View Website ↗
          </a>
        </header>

        <main className="admin-container">
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <span className="admin-eyebrow">
                  OPPORTUNITY HUB MANAGEMENT
                </span>
                <h2>Admin Login</h2>
                <p>Log in to manage opportunities and applications.</p>
              </div>
            </div>

            {error && <p className="admin-error">{error}</p>}
            {message && <p className="admin-success">{message}</p>}

            <form className="admin-form" onSubmit={handleLogin}>
              <label className="admin-full-width">
                Username
                <input
                  name="username"
                  value={loginForm.username}
                  onChange={handleLoginChange}
                  placeholder="Enter admin username"
                  autoComplete="username"
                  required
                />
              </label>

              <label className="admin-full-width">
                Password
                <input
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  required
                />
              </label>

              <div className="admin-full-width admin-form-actions">
                <button
                  className="admin-submit-button"
                  type="submit"
                  disabled={loginLoading}
                >
                  {loginLoading ? 'Logging in...' : 'Log In'}
                </button>
              </div>
            </form>
          </section>
        </main>

        <footer className="admin-footer">
          Opportunity Hub · Admin Login
        </footer>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <a className="admin-brand" href="/">
          <span className="admin-brand-icon">O</span>
          Opportunity Hub<span className="admin-brand-dot">.</span>
        </a>

        <div className="admin-row-actions">
          <a className="admin-home-link" href="/">
            View Website ↗
          </a>
          <button
            className="admin-cancel-button"
            type="button"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="admin-container">
        <section className="admin-welcome">
          <span className="admin-eyebrow">OPPORTUNITY HUB MANAGEMENT</span>
          <h1>Admin Dashboard</h1>
          <p>Welcome, {username}. Manage listings and applications.</p>
        </section>

        {error && <p className="admin-error">{error}</p>}
        {message && <p className="admin-success">{message}</p>}

        <section className="admin-stats">
          <div className="admin-stat-card">
            <span>📋 Total listings</span>
            <strong>{jobs.length}</strong>
          </div>
          <div className="admin-stat-card">
            <span>🎓 Internships</span>
            <strong>
              {jobs.filter((job) => job.type === 'Internship').length}
            </strong>
          </div>
          <div className="admin-stat-card">
            <span>💼 Full-time jobs</span>
            <strong>
              {jobs.filter((job) => job.type === 'Full-time').length}
            </strong>
          </div>
          <div className="admin-stat-card">
            <span>✉️ Total applications</span>
            <strong>{applications.length}</strong>
          </div>
        </section>

        {/* Applications section */}
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Job Applications</h2>
              <p>View applications submitted by candidates.</p>
            </div>

            <div className="admin-row-actions">
              <button
                className="admin-submit-button"
                type="button"
                onClick={() => {
                  setShowApplications(true)
                  loadApplications()
                }}
                disabled={applicationsLoading}
              >
                {applicationsLoading
                  ? 'Loading...'
                  : 'View Applications'}
              </button>

              {showApplications && (
                <button
                  className="admin-cancel-button"
                  type="button"
                  onClick={loadApplications}
                  disabled={applicationsLoading}
                >
                  Refresh
                </button>
              )}
            </div>
          </div>

          {applicationsError && (
            <p className="admin-error" role="alert">
              {applicationsError}
            </p>
          )}

          {showApplications && (
            applicationsLoading ? (
              <p>Loading applications...</p>
            ) : applicationsError ? null : applications.length === 0 ? (
              <p>No applications have been submitted yet.</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table applications-table">
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Job</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Resume</th>
                      <th>Cover Letter</th>
                      <th>Applied On</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((application) => (
                      <tr key={application._id}>
                        <td>{application.applicantName}</td>
                        <td>
                          <strong>
                            {application.job?.title || 'Job unavailable'}
                          </strong>
                          <br />
                          {application.job?.company || ''}
                        </td>
                        <td>
                          <a href={`mailto:${application.email}`}>
                            {application.email}
                          </a>
                        </td>
                        <td>{application.phone}</td>
                        <td>
                          {application.resumeLink ? (
                            <a
                              href={application.resumeLink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Resume
                            </a>
                          ) : (
                            'Not provided'
                          )}
                        </td>
                        <td>
                          {application.coverLetter || 'Not provided'}
                        </td>
                        <td>
                          {application.createdAt
                            ? new Date(
                                application.createdAt,
                              ).toLocaleDateString()
                            : 'Unknown'}
                        </td>
                        <td>
                          <select
                            value={application.status || 'Pending'}
                            onChange={(event) =>
                              updateApplicationStatus(
                                application._id,
                                event.target.value,
                              )
                            }
                            aria-label={`Status for ${application.applicantName}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Reviewed">Reviewed</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </section>

        {/* Add or edit job */}
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>{editingId ? 'Edit Job Listing' : 'Add a New Job'}</h2>
              <p>Complete the details below and save your listing.</p>
            </div>

            {editingId && (
              <button
                className="admin-cancel-button"
                type="button"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form className="admin-form" onSubmit={handleSubmit}>
            <label>
              Job Title *
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Company Name *
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Location *
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Job Type *
              <select name="type" value={form.type} onChange={handleChange}>
                <option value="Internship">Internship</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </label>

            <label>
              Category *
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="Technology">Technology</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Data">Data</option>
                <option value="HR">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Sales">Sales</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              Salary / Stipend
              <input
                name="salary"
                value={form.salary}
                onChange={handleChange}
                placeholder="e.g. ₹10,000/month"
              />
            </label>

            <label className="admin-full-width">
              Job Description *
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="5"
                required
              />
            </label>

            <label className="admin-full-width">
              Requirements
              <textarea
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                placeholder="Separate requirements with commas"
                rows="3"
              />
            </label>

            <label className="admin-full-width">
              Skills
              <input
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="React, JavaScript, HTML, CSS"
              />
            </label>

            <label className="admin-full-width">
              Application Link
              <input
                type="url"
                name="applicationLink"
                value={form.applicationLink}
                onChange={handleChange}
                placeholder="https://example.com/apply"
              />
            </label>

            <label>
              Application Deadline
              <input
                type="date"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
              />
            </label>

            <div className="admin-full-width admin-form-actions">
              <button
                className="admin-submit-button"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Update Job'
                    : 'Add Job Listing'}
              </button>

              <button
                className="admin-cancel-button"
                type="button"
                onClick={resetForm}
              >
                Clear Form
              </button>
            </div>
          </form>
        </section>

        {/* Manage existing jobs */}
        <section className="admin-panel admin-list-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Manage Job Listings</h2>
              <p>Listings retrieved from your backend API.</p>
            </div>

            <button
              className="admin-cancel-button"
              type="button"
              onClick={loadJobs}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p>Loading job listings...</p>
          ) : jobs.length === 0 ? (
            <p>No jobs found. Add your first listing above.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job._id}>
                      <td>{job.title}</td>
                      <td>{job.company}</td>
                      <td>{job.type}</td>
                      <td>{job.location}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            className="admin-edit-button"
                            type="button"
                            onClick={() => editJob(job)}
                          >
                            Edit
                          </button>
                          <button
                            className="admin-delete-button"
                            type="button"
                            onClick={() => deleteJob(job)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className="admin-footer">
        Opportunity Hub Admin Panel · Manage your opportunities
      </footer>
    </div>
  )
}

export default Admin