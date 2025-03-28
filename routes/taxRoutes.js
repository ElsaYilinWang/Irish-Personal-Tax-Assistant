const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/User');
const TaxReturn = require('../models/TaxReturn');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @route   GET /api/tax/calculate
 * @desc    Calculate tax based on provided income, deductions, and credits
 * @access  Public
 */
router.get('/calculate', (req, res) => {
  try {
    const { income, deductions, taxCredits } = req.query;
    
    // Convert to numbers and provide defaults
    const grossIncome = Number(income) || 0;
    const totalDeductions = Number(deductions) || 0;
    const totalTaxCredits = Number(taxCredits) || 0;

    // Calculate taxable income
    const taxableIncome = Math.max(0, grossIncome - totalDeductions);

    // 2023 Irish tax rates
    const standardRateCutoff = 36800; // Standard rate band for single person
    const standardRate = 0.2; // 20%
    const higherRate = 0.4; // 40%

    // Calculate tax
    let taxAtStandardRate = 0;
    let taxAtHigherRate = 0;

    if (taxableIncome <= standardRateCutoff) {
      taxAtStandardRate = taxableIncome * standardRate;
    } else {
      taxAtStandardRate = standardRateCutoff * standardRate;
      taxAtHigherRate = (taxableIncome - standardRateCutoff) * higherRate;
    }

    const grossTax = taxAtStandardRate + taxAtHigherRate;
    
    // Apply tax credits
    const netTax = Math.max(0, grossTax - totalTaxCredits);

    // USC (Universal Social Charge) - simplified calculation
    let usc = 0;
    if (grossIncome > 13000) {
      // Simplified USC calculation
      if (grossIncome <= 22920) {
        usc = grossIncome * 0.02; // 2% rate for simplicity
      } else {
        usc = 22920 * 0.02 + (grossIncome - 22920) * 0.045; // 2% up to €22,920, 4.5% thereafter (simplified)
      }
    }

    // PRSI (Pay Related Social Insurance) - simplified calculation
    const prsi = grossIncome > 18304 ? grossIncome * 0.04 : 0; // 4% for most employees

    // Total tax liability
    const totalTaxLiability = netTax + usc + prsi;
    
    // Net income after tax
    const netIncome = grossIncome - totalTaxLiability;

    // Effective tax rate
    const effectiveTaxRate = grossIncome > 0 ? (totalTaxLiability / grossIncome) * 100 : 0;

    // Return tax calculation results
    res.status(200).json({
      success: true,
      data: {
        grossIncome,
        taxableIncome,
        taxAtStandardRate,
        taxAtHigherRate,
        grossTax,
        taxCredits: totalTaxCredits,
        netTax,
        usc,
        prsi,
        totalTaxLiability,
        netIncome,
        effectiveTaxRate: effectiveTaxRate.toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error calculating tax', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/tax/create
 * @desc    Create a new tax return
 * @access  Private
 */
router.post('/create', auth, async (req, res, next) => {
  try {
    const { income, deductions, taxCredits, year } = req.body;
    
    // Create new tax return with authenticated user's ID
    const taxReturn = new TaxReturn({
      userId: req.userId,
      income,
      deductions,
      taxCredits,
      year
    });
    
    await taxReturn.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Tax return created successfully', 
      data: taxReturn 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/tax/user/:userId
 * @desc    Get all tax returns for a user
 * @access  Private
 */
router.get('/user/:userId', auth, async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own tax returns unless they're an admin
    if (req.userId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own tax returns.' 
      });
    }
    
    const taxReturns = await TaxReturn.find({ userId }).sort({ year: -1 });
    console.log('Fetched Tax Returns:', taxReturns); // Debugging log
    
    res.status(200).json(taxReturns);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/tax/return/:id
 * @desc    Get a specific tax return by ID
 * @access  Private
 */
router.get('/return/:id', auth, async (req, res, next) => {
  try {
    const taxReturn = await TaxReturn.findById(req.params.id);
    
    if (!taxReturn) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tax return not found' 
      });
    }
    
    // Ensure user can only access their own tax returns unless they're an admin
    if (taxReturn.userId.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own tax returns.' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: taxReturn 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/tax/return/:id
 * @desc    Update a tax return
 * @access  Private
 */
router.put('/return/:id', auth, async (req, res, next) => {
  try {
    const { income, deductions, taxCredits, year } = req.body;
    let taxReturn = await TaxReturn.findById(req.params.id);
    
    if (!taxReturn) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tax return not found' 
      });
    }
    
    // Ensure user can only update their own tax returns
    if (taxReturn.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only update your own tax returns.' 
      });
    }
    
    // Update tax return
    taxReturn = await TaxReturn.findByIdAndUpdate(
      req.params.id,
      { income, deductions, taxCredits, year },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({ 
      success: true, 
      message: 'Tax return updated successfully', 
      data: taxReturn 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/tax/return/:id
 * @desc    Delete a tax return
 * @access  Private
 */
router.delete('/return/:id', auth, async (req, res, next) => {
  try {
    const taxReturn = await TaxReturn.findById(req.params.id);
    
    if (!taxReturn) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tax return not found' 
      });
    }
    
    // Ensure user can only delete their own tax returns
    if (taxReturn.userId.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only delete your own tax returns.' 
      });
    }
    
    await TaxReturn.deleteOne({ _id: req.params.id });
    
    res.status(200).json({ 
      success: true, 
      message: 'Tax return deleted successfully' 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/tax/deadlines
 * @desc    Get tax deadlines
 * @access  Public
 */
router.get('/deadlines', async (req, res, next) => {
  try {
    // In a real application, these would come from a database
    const currentYear = new Date().getFullYear();
    const deadlines = [
      { 
        date: `${currentYear}-10-31`, 
        description: 'Income Tax Return Deadline' 
      },
      { 
        date: `${currentYear}-12-15`, 
        description: 'Capital Gains Tax Payment Deadline' 
      },
      { 
        date: `${currentYear + 1}-01-31`, 
        description: 'Tax Payment Deadline for Self-Assessed Income Tax' 
      }
    ];
    
    console.log('Fetched Deadlines:', deadlines); // Debugging log
    
    res.status(200).json({ 
      success: true, 
      data: deadlines 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/tax/progress
 * @desc    Get user's tax filing progress
 * @access  Private
 */
router.get('/progress', auth, async (req, res, next) => {
  try {
    // In a real application, this would be calculated based on the user's tax filing status
    // For now, we'll return a placeholder value
    const progress = 70;
    
    console.log('Fetched Progress:', progress); // Debugging log
    
    res.status(200).json({ 
      success: true, 
      data: progress 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/tax/document
 * @desc    Upload a tax-related document
 * @access  Private
 */
router.post('/document', auth, upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { documentType } = req.body;
    
    // Create new document with file information
    const document = new Document({
      userId: req.userId,
      documentType,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      filePath: req.file.path,
      fileType: req.file.mimetype
    });
    
    await document.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Document uploaded successfully', 
      data: {
        id: document._id,
        documentType: document.documentType,
        fileName: document.fileName,
        fileSize: document.fileSize,
        uploadDate: document.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/tax/documents
 * @desc    Get all documents for the authenticated user
 * @access  Private
 */
router.get('/documents', auth, async (req, res, next) => {
  try {
    const documents = await Document.find({ userId: req.userId }).sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      data: documents.map(doc => ({
        id: doc._id,
        documentType: doc.documentType,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        uploadDate: doc.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/tax/document/:id
 * @desc    Download a document
 * @access  Private
 */
router.get('/document/:id', auth, async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    // Ensure user can only access their own documents
    if (document.userId.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only access your own documents.' 
      });
    }
    
    res.download(document.filePath, document.fileName);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/tax/document/:id
 * @desc    Delete a document
 * @access  Private
 */
router.delete('/document/:id', auth, async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    // Ensure user can only delete their own documents
    if (document.userId.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only delete your own documents.' 
      });
    }
    
    // Delete the file from the filesystem
    const fs = require('fs');
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }
    
    // Delete the document from the database
    await Document.deleteOne({ _id: document._id });
    
    res.status(200).json({ 
      success: true, 
      message: 'Document deleted successfully' 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
