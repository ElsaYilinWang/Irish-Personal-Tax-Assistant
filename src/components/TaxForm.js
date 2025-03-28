import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { taxAPI } from '../utils/api';
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
  const [calculating, setCalculating] = useState(false);
  const { currentUser } = useAuth();
  
  // Calculate tax when form data changes
  useEffect(() => {
    const calculateTaxFromAPI = async () => {
      // Don't make API calls if all fields are empty
      if (!formData.income && !formData.deductions && !formData.taxCredits) {
        setTaxResults(null);
        return;
      }
      
      setCalculating(true);
      try {
        const results = await taxAPI.calculateTax(
          formData.income || 0,
          formData.deductions || 0,
          formData.taxCredits || 0
        );
        setTaxResults(results);
      } catch (error) {
        console.error('Error calculating tax:', error);
        toast.error('Failed to calculate tax. Please try again.');
      } finally {
        setCalculating(false);
      }
    };
    
    // Use a debounce to avoid making too many API calls
    const debounceTimer = setTimeout(() => {
      calculateTaxFromAPI();
    }, 500);
    
    return () => clearTimeout(debounceTimer);
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
      // Save tax return to the backend
      await taxAPI.saveTaxReturn({
        income: Number(formData.income) || 0,
        deductions: Number(formData.deductions) || 0,
        taxCredits: Number(formData.taxCredits) || 0,
        year: Number(formData.year)
      });
      
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
          
          <button type="submit" disabled={loading || calculating}>
            {loading ? 'Saving...' : 'Save Tax Information'}
          </button>
        </form>
        
        {(loading || calculating) && <LoadingSpinner />}
        
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
