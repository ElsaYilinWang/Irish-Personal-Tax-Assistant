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
  const [currentStep, setCurrentStep] = useState(1);
  const [showDeductionsGuide, setShowDeductionsGuide] = useState(false);
  const [showTaxCreditsGuide, setShowTaxCreditsGuide] = useState(false);
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
  
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const toggleDeductionsGuide = () => {
    setShowDeductionsGuide(!showDeductionsGuide);
  };
  
  const toggleTaxCreditsGuide = () => {
    setShowTaxCreditsGuide(!showTaxCreditsGuide);
  };
  
  // Render step 1: Income Information
  const renderStep1 = () => {
    return (
      <div className="step-content">
        <h2>Step 1: Income Information</h2>
        <p>Enter your total annual income from all sources.</p>
        
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
          <div className="form-help">
            Include all sources of income: salary, self-employment, rental income, etc.
          </div>
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
        
        <div className="step-navigation">
          <button type="button" className="next-btn" onClick={nextStep}>
            Next: Deductions
          </button>
        </div>
      </div>
    );
  };
  
  // Render step 2: Deductions
  const renderStep2 = () => {
    return (
      <div className="step-content">
        <h2>Step 2: Deductions</h2>
        <p>Enter your eligible tax deductions.</p>
        
        <div className="form-group">
          <div className="label-with-help">
            <label htmlFor="deductions">Deductions (€)</label>
            <button 
              type="button" 
              className="help-btn" 
              onClick={toggleDeductionsGuide}
            >
              {showDeductionsGuide ? 'Hide Guide' : 'Show Guide'}
            </button>
          </div>
          
          <input
            type="number"
            id="deductions"
            name="deductions"
            value={formData.deductions}
            onChange={handleChange}
            placeholder="Enter your deductions"
          />
          
          {showDeductionsGuide && (
            <div className="guide-box">
              <h3>Common Tax Deductions in Ireland</h3>
              <ul>
                <li>
                  <strong>Pension Contributions</strong>
                  <p>Contributions to approved pension schemes are tax deductible, subject to age-related limits.</p>
                </li>
                <li>
                  <strong>Medical Expenses</strong>
                  <p>You can claim tax relief at the standard rate (20%) for qualifying medical expenses.</p>
                </li>
                <li>
                  <strong>Work-Related Expenses</strong>
                  <p>Certain expenses that are wholly, exclusively, and necessarily for work purposes.</p>
                </li>
                <li>
                  <strong>Tuition Fees</strong>
                  <p>Tax relief may be available for third-level education fees.</p>
                </li>
                <li>
                  <strong>Rental Expenses</strong>
                  <p>If you're a landlord, certain expenses related to renting property may be deductible.</p>
                </li>
              </ul>
              <p className="guide-note">Note: This is a simplified guide. Please consult with a tax professional for advice specific to your situation.</p>
            </div>
          )}
        </div>
        
        <div className="step-navigation">
          <button type="button" className="prev-btn" onClick={prevStep}>
            Previous: Income
          </button>
          <button type="button" className="next-btn" onClick={nextStep}>
            Next: Tax Credits
          </button>
        </div>
      </div>
    );
  };
  
  // Render step 3: Tax Credits
  const renderStep3 = () => {
    return (
      <div className="step-content">
        <h2>Step 3: Tax Credits</h2>
        <p>Enter your eligible tax credits.</p>
        
        <div className="form-group">
          <div className="label-with-help">
            <label htmlFor="taxCredits">Tax Credits (€)</label>
            <button 
              type="button" 
              className="help-btn" 
              onClick={toggleTaxCreditsGuide}
            >
              {showTaxCreditsGuide ? 'Hide Guide' : 'Show Guide'}
            </button>
          </div>
          
          <input
            type="number"
            id="taxCredits"
            name="taxCredits"
            value={formData.taxCredits}
            onChange={handleChange}
            placeholder="Enter your tax credits"
          />
          
          {showTaxCreditsGuide && (
            <div className="guide-box">
              <h3>Common Tax Credits in Ireland</h3>
              <ul>
                <li>
                  <strong>Personal Tax Credit</strong>
                  <p>€1,775 for single person (2023)</p>
                </li>
                <li>
                  <strong>Employee Tax Credit (PAYE Credit)</strong>
                  <p>€1,775 for PAYE employees (2023)</p>
                </li>
                <li>
                  <strong>Earned Income Tax Credit</strong>
                  <p>€1,775 for self-employed individuals (2023)</p>
                </li>
                <li>
                  <strong>Home Carer Tax Credit</strong>
                  <p>Up to €1,700 for married couples where one spouse cares for a dependent person (2023)</p>
                </li>
                <li>
                  <strong>Single Person Child Carer Credit</strong>
                  <p>€1,650 for single parents (2023)</p>
                </li>
                <li>
                  <strong>Age Tax Credit</strong>
                  <p>€245 if you or your spouse is 65 or over (2023)</p>
                </li>
              </ul>
              <div className="tax-credit-calculator">
                <h4>Estimated Tax Credits</h4>
                <p>Based on common credits, a single PAYE employee would typically have:</p>
                <ul>
                  <li>Personal Tax Credit: €1,775</li>
                  <li>Employee Tax Credit: €1,775</li>
                  <li>Total: €3,550</li>
                </ul>
                <p className="guide-note">Note: This is a simplified guide. Please consult with a tax professional for advice specific to your situation.</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="step-navigation">
          <button type="button" className="prev-btn" onClick={prevStep}>
            Previous: Deductions
          </button>
          <button type="submit" className="submit-btn" disabled={loading || calculating}>
            {loading ? 'Saving...' : 'Save Tax Information'}
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="tax-form-container">
      <h1>Tax Form</h1>
      <p>Complete this form to calculate your Irish income tax.</p>
      
      <div className="tax-form-content">
        <div className="step-indicator">
          <div className={`step ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Income</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Deductions</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep === 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Tax Credits</div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="tax-form">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
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
