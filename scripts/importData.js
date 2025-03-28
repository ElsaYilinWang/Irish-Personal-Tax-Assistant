require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const TaxReturn = require('../models/TaxReturn');
const Document = require('../models/Document');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB Atlas');
  importData();
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
  process.exit(1);
});

// Helper function to transform MongoDB extended JSON format
function transformMongoId(obj) {
  const transformed = { ...obj };
  
  // Handle _id with $oid format
  if (transformed._id && transformed._id.$oid) {
    transformed._id = transformed._id.$oid;
  }
  
  // Handle userId with $oid format
  if (transformed.userId && transformed.userId.$oid) {
    transformed.userId = transformed.userId.$oid;
  }
  
  return transformed;
}

async function importData() {
  try {
    // Read data from JSON files
    const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/users.json'), 'utf8'));
    const taxReturnsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/taxreturns.json'), 'utf8'));
    
    // Check if documents.json exists
    let documentsData = [];
    const documentsPath = path.join(__dirname, '../data/documents.json');
    if (fs.existsSync(documentsPath)) {
      documentsData = JSON.parse(fs.readFileSync(documentsPath, 'utf8'));
    }

    // Transform data to handle MongoDB extended JSON format
    const transformedUsers = usersData.map(transformMongoId);
    const transformedTaxReturns = taxReturnsData.map(transformMongoId);
    const transformedDocuments = documentsData.map(transformMongoId);

    console.log(`Found ${transformedUsers.length} users, ${transformedTaxReturns.length} tax returns, and ${transformedDocuments.length} documents in JSON files`);

    // Clear existing data
    await User.deleteMany({});
    await TaxReturn.deleteMany({});
    await Document.deleteMany({});
    console.log('Cleared existing data from collections');

    // Import users
    if (transformedUsers.length > 0) {
      const users = await User.insertMany(transformedUsers);
      console.log(`Imported ${users.length} users`);
    }

    // Import tax returns
    if (transformedTaxReturns.length > 0) {
      const taxReturns = await TaxReturn.insertMany(transformedTaxReturns);
      console.log(`Imported ${taxReturns.length} tax returns`);
    }

    // Import documents
    if (transformedDocuments.length > 0) {
      const documents = await Document.insertMany(transformedDocuments);
      console.log(`Imported ${documents.length} documents`);
    }

    console.log('Data import completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
}
