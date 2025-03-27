import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { calculateTax } from '../utils/taxCalculator';
import LoadingSpinner from './LoadingSpinner';

function TaxForm() {
  const [formData, setFormData] = useState({
    income: '',
    deductions: '',
    taxCredits: '',
    year: new Date().getFullYear()
  });
  
  const [taxResults, setTaxResults] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Calculate tax in real-time when form data changes
  useEffect(() => {
    if (formData.income) {
      const results = calculateTax(
        formData.income,
        formData.deductions,
        formData.taxCredits
      );
      setTaxResults(results);
    }
  }, [formData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Here you would normally send the data to your backend
      // For now, we'll just simulate a network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Tax information saved successfully!');
    } catch (error) {
      toast.error('Failed to save tax information.');
      console.error('Error saving tax information:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="tax-form-container">
      <h1>Tax Form</h1>
      <p>Fill out your tax information to get a real-time tax calculation.</p>
      
      <div className="tax-form-content">
        <form onSubmit={handleSubmit} className="tax-form">
          <div className="form-group">
            <label htmlFor="income">Annual Income (€)</label>
            <input
              type="number"
              id="income"
              name="income"
              value={formData.income}
              onChange={handleChange}
              placeholder="Enter your annual income"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="deductions">Deductions (€)</label>
            <input
              type="number"
              id="deductions"
              name="deductions"
              value={formData.deductions}
              onChange={handleChange}
              placeholder="Enter your deductions"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="taxCredits">Tax Credits (€)</label>
            <input
              type="number"
              id="taxCredits"
              name="taxCredits"
              value={formData.taxCredits}
              onChange={handleChange}
              placeholder="Enter your tax credits"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="year">Tax Year</label>
            <select
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Tax Information'}
          </button>
        </form>
        
        {loading && <LoadingSpinner />}
        
        {taxResults && (
          <div className="tax-results">
            <h2>Tax Calculation Preview</h2>
            <div className="result-item">
              <span>Gross Income:</span>
              <span>€{taxResults.grossIncome.toFixed(2)}</span>
            </div>
            <div className="result-item">
              <span>Taxable Income:</span>
              <span>€{taxResults.taxableIncome.toFixed(2)}</span>
            </div>
            <div className="result-item">
              <span>Tax at 20%:</span>
              <span>€{taxResults.taxAtStandardRate.toFixed(2)}</span>
            </div>
            <div className="result-item">
              <span>Tax at 40%:</span>
              <span>€{taxResults.taxAtHigherRate.toFixed(2)}</span>
            </div>
            <div className="result-item">
              <span>Gross Tax:</span>
              <span>€{taxResults.grossTax.toFixed(2)}</span>
            </div>
            <div className="result-item">
              <span>Tax Credits:</span>
              <span>€{taxResults.taxCredits.toFixed(2)}</span>
            </div>
            <div className="result-item">
              <span>Net Tax:</span>
              <span>€{taxResults.netTax.toFixed(2)}</span>
            </div>
            <div className="result-item">
              <span>USC:</span>
              <span>€{taxResults.usc.toFixed(2)}</span>
            </div>
            <div className="result-item">
              <span>PRSI:</span>
              <span>€{taxResults.prsi.toFixed(2)}</span>
            </div>
            <div className="result-item total">
              <span>Total Tax Liability:</span>
              <span>€{taxResults.totalTaxLiability.toFixed(2)}</span>
            </div>
            <div className="result-item total">
              <span>Net Income:</span>
              <span>€{taxResults.netIncome.toFixed(2)}</span>
            </div>
            <div className="result-item">
              <span>Effective Tax Rate:</span>
              <span>{taxResults.effectiveTaxRate}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaxForm;
