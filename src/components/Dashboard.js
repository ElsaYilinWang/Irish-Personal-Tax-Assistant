import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
  const [taxSummaries, setTaxSummaries] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userId = '67e5bebdc739b45f12cc95cc'; // Replace with a valid user ID
        const summariesResponse = await axios.get(`/api/tax/user/${userId}`);
        setTaxSummaries(summariesResponse.data || []); // Ensure it's an array

        const deadlinesResponse = await axios.get('/api/deadlines'); // Placeholder endpoint
        setDeadlines(deadlinesResponse.data || []); // Ensure it's an array

        const progressResponse = await axios.get('/api/progress'); // Placeholder endpoint
        setProgress(progressResponse.data || 0); // Ensure it's a number
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to the Irish Personal Tax Assistant Dashboard.</p>
      <h2>Tax Summaries</h2>
      <ul>
        {taxSummaries.length > 0 ? (
          taxSummaries.map((summary, index) => (
            <li key={index}>{summary.year}: {summary.summary}</li>
          ))
        ) : (
          <li>No tax summaries available</li>
        )}
      </ul>
      <h2>Deadlines</h2>
      <ul>
        {deadlines.length > 0 ? (
          deadlines.map((deadline, index) => (
            <li key={index}>{deadline}</li>
          ))
        ) : (
          <li>No deadlines available</li>
        )}
      </ul>
      <h2>Progress</h2>
      <progress value={progress} max="100">{progress}%</progress>
    </div>
  );
}

export default Dashboard;
