import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { taxAPI } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

function Dashboard() {
  const [taxSummaries, setTaxSummaries] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch real data from API
        const deadlinesPromise = taxAPI.getTaxDeadlines();
        const progressPromise = taxAPI.getTaxProgress();
        
        // If user is authenticated, fetch their tax returns
        let taxReturnsPromise = Promise.resolve([]);
        if (currentUser && currentUser.id) {
          taxReturnsPromise = taxAPI.getUserTaxReturns(currentUser.id);
        }
        
        // Wait for all promises to resolve
        const [deadlinesResponse, progressResponse, taxReturnsResponse] = await Promise.allSettled([
          deadlinesPromise,
          progressPromise,
          taxReturnsPromise
        ]);
        
        // Process deadlines
        if (deadlinesResponse.status === 'fulfilled') {
          setDeadlines(deadlinesResponse.value || []);
        } else {
          console.error('Error fetching deadlines:', deadlinesResponse.reason);
          // Fallback to mock data if API fails
          setDeadlines(mockDeadlines);
        }
        
        // Process progress
        if (progressResponse.status === 'fulfilled') {
          setProgress(progressResponse.value || 0);
        } else {
          console.error('Error fetching progress:', progressResponse.reason);
          // Fallback to mock data if API fails
          setProgress(65);
        }
        
        // Process tax returns
        if (taxReturnsResponse.status === 'fulfilled' && taxReturnsResponse.value) {
          // Transform tax returns into summaries
          const summaries = taxReturnsResponse.value.map(tax => ({
            id: tax._id,
            year: tax.year,
            summary: `Total Tax Paid: €${tax.totalTaxLiability?.toFixed(2) || '0.00'}`,
            amount: tax.totalTaxLiability || 0
          }));
          
          setTaxSummaries(summaries.length > 0 ? summaries : mockTaxSummaries);
        } else {
          console.error('Error fetching tax returns:', taxReturnsResponse.reason);
          // Fallback to mock data if API fails
          setTaxSummaries(mockTaxSummaries);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load some dashboard data. Using sample data instead.');
        // Fallback to mock data
        setTaxSummaries(mockTaxSummaries);
        setDeadlines(mockDeadlines);
        setProgress(65);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  // Mock data for demonstration
  const mockTaxSummaries = [
    { year: 2023, summary: 'Total Tax Paid: €12,450', amount: 12450 },
    { year: 2022, summary: 'Total Tax Paid: €11,280', amount: 11280 },
    { year: 2021, summary: 'Total Tax Paid: €10,150', amount: 10150 }
  ];

  const mockDeadlines = [
    { date: '2023-10-31', description: 'Income Tax Return Deadline' },
    { date: '2023-12-15', description: 'Capital Gains Tax Payment Deadline' },
    { date: '2024-01-31', description: 'Tax Payment Deadline for Self-Assessed Income Tax' }
  ];

  // Format date to display in a more readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IE', options);
  };

  // Calculate days remaining until deadline
  const calculateDaysRemaining = (dateString) => {
    const deadline = new Date(dateString);
    const today = new Date();
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Handle button clicks
  const handleContinueFiling = () => {
    navigate('/tax-form');
  };
  
  const handleViewTaxDetails = (taxId, year) => {
    if (taxId) {
      navigate(`/tax-form?id=${taxId}`);
    } else {
      navigate(`/tax-form?year=${year}`);
    }
  };
  
  const handleAddDocument = () => {
    navigate('/documents');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome to CáinSábháil</h1>
        <p>Your Irish Personal Tax Assistant Dashboard</p>
        {currentUser && <h2>Hello, {currentUser.username || 'there'}!</h2>}
      </div>

      {loading ? (
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading your tax information...</p>
        </div>
      ) : (
        <div className="dashboard-content">
          <div className="dashboard-card tax-progress-card">
            <h2>Tax Filing Progress</h2>
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="progress-text">{progress}% Complete</div>
            </div>
            <div className="progress-actions">
              <button 
                className="continue-btn"
                onClick={handleContinueFiling}
              >
                Continue Filing
              </button>
            </div>
          </div>

          <div className="dashboard-row">
            <div className="dashboard-card">
              <h2>Tax Summaries</h2>
              <div className="tax-summaries">
                {taxSummaries.length > 0 ? (
                  taxSummaries.map((summary, index) => (
                    <div key={index} className="summary-item">
                      <div className="summary-year">{summary.year}</div>
                      <div className="summary-details">
                        <div className="summary-text">{summary.summary}</div>
                        <div className="summary-actions">
                          <button 
                            className="view-details-btn"
                            onClick={() => handleViewTaxDetails(summary.id, summary.year)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">
                    <p>No tax summaries available</p>
                    <button 
                      className="action-btn"
                      onClick={handleContinueFiling}
                    >
                      Create Your First Tax Return
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="dashboard-card">
              <h2>Upcoming Deadlines</h2>
              <div className="deadlines">
                {deadlines.length > 0 ? (
                  deadlines.map((deadline, index) => {
                    const daysRemaining = calculateDaysRemaining(deadline.date);
                    return (
                      <div key={index} className={`deadline-item ${daysRemaining < 30 ? 'urgent' : ''}`}>
                        <div className="deadline-date">{formatDate(deadline.date)}</div>
                        <div className="deadline-description">{deadline.description}</div>
                        <div className="deadline-countdown">
                          {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Due today!'}
                        </div>
                        {daysRemaining < 30 && (
                          <div className="deadline-actions">
                            <button 
                              className="action-btn"
                              onClick={handleContinueFiling}
                            >
                              Prepare Filing
                            </button>
                            <button 
                              className="action-btn secondary"
                              onClick={handleAddDocument}
                            >
                              Upload Documents
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="no-data">No deadlines available</div>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-card tips-card">
            <h2>Tax Saving Tips</h2>
            <div className="tips-container">
              <div className="tip">
                <h3>Pension Contributions</h3>
                <p>Maximize your tax relief by contributing to a pension fund. Contributions are deductible at your marginal rate of tax.</p>
                <button 
                  className="learn-more-btn"
                  onClick={() => window.open('https://www.revenue.ie/en/jobs-and-pensions/pensions/tax-relief-for-pension-contributions.aspx', '_blank')}
                >
                  Learn More
                </button>
              </div>
              <div className="tip">
                <h3>Medical Expenses</h3>
                <p>Don't forget to claim tax relief on medical expenses at 20%. Keep all receipts for doctor visits, prescribed medicines, and hospital charges.</p>
                <button 
                  className="learn-more-btn"
                  onClick={() => window.open('https://www.revenue.ie/en/personal-tax-credits-reliefs-and-exemptions/health-and-age/health-expenses/index.aspx', '_blank')}
                >
                  Learn More
                </button>
              </div>
              <div className="tip">
                <h3>Work from Home Relief</h3>
                <p>If you work from home, you may be eligible for tax relief on expenses like electricity, heating, and broadband.</p>
                <button 
                  className="learn-more-btn"
                  onClick={() => window.open('https://www.revenue.ie/en/jobs-and-pensions/tax-relief-for-expenses/e-working-and-home-workers-relief.aspx', '_blank')}
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
