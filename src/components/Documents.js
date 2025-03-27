import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from './LoadingSpinner';

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState('receipt');
  
  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);
  
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // In a real application, this would be an API call to fetch documents
      // For now, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockDocuments = [
        { id: 1, name: 'Income Statement 2023.pdf', type: 'income_statement', uploadDate: '2023-12-15', size: '1.2 MB' },
        { id: 2, name: 'Medical Receipts.pdf', type: 'receipt', uploadDate: '2023-11-20', size: '3.5 MB' },
        { id: 3, name: 'Property Tax Receipt.pdf', type: 'receipt', uploadDate: '2023-10-05', size: '0.8 MB' }
      ];
      
      setDocuments(mockDocuments);
    } catch (error) {
      toast.error('Failed to fetch documents.');
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    
    try {
      // In a real application, this would be an API call to upload the file
      // For now, we'll simulate the upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a new document object
      const newDocument = {
        id: documents.length + 1,
        name: file.name,
        type: documentType,
        uploadDate: new Date().toISOString().split('T')[0],
        size: formatFileSize(file.size)
      };
      
      // Add the new document to the list
      setDocuments([newDocument, ...documents]);
      
      toast.success('Document uploaded successfully!');
      
      // Reset the file input
      e.target.value = '';
    } catch (error) {
      toast.error('Failed to upload document.');
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
    }
  };
  
  const handleDeleteDocument = async (id) => {
    try {
      // In a real application, this would be an API call to delete the document
      // For now, we'll simulate the deletion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove the document from the list
      setDocuments(documents.filter(doc => doc.id !== id));
      
      toast.success('Document deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete document.');
      console.error('Error deleting document:', error);
    }
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  const getDocumentTypeLabel = (type) => {
    const types = {
      'receipt': 'Receipt',
      'income_statement': 'Income Statement',
      'tax_return': 'Tax Return',
      'property_tax': 'Property Tax',
      'other': 'Other'
    };
    return types[type] || 'Unknown';
  };
  
  return (
    <div className="documents-container">
      <h1>Documents</h1>
      <p>Upload and manage your tax-related documents.</p>
      
      <div className="upload-section">
        <h2>Upload New Document</h2>
        <div className="upload-form">
          <div className="form-group">
            <label htmlFor="documentType">Document Type</label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              <option value="receipt">Receipt</option>
              <option value="income_statement">Income Statement</option>
              <option value="tax_return">Tax Return</option>
              <option value="property_tax">Property Tax</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="fileUpload">Select File</label>
            <input
              type="file"
              id="fileUpload"
              onChange={handleFileUpload}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <p className="file-info">Accepted formats: PDF, DOC, DOCX, JPG, PNG</p>
          </div>
          
          {uploading && (
            <div className="upload-progress">
              <LoadingSpinner />
              <p>Uploading document...</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="documents-list">
        <h2>Your Documents</h2>
        
        {loading ? (
          <LoadingSpinner />
        ) : documents.length === 0 ? (
          <p className="no-documents">No documents found. Upload your first document above.</p>
        ) : (
          <div className="documents-table">
            <div className="table-header">
              <div className="column">Name</div>
              <div className="column">Type</div>
              <div className="column">Upload Date</div>
              <div className="column">Size</div>
              <div className="column">Actions</div>
            </div>
            
            {documents.map(doc => (
              <div key={doc.id} className="document-item">
                <div className="column document-name">{doc.name}</div>
                <div className="column">{getDocumentTypeLabel(doc.type)}</div>
                <div className="column">{doc.uploadDate}</div>
                <div className="column">{doc.size}</div>
                <div className="column actions">
                  <button className="view-btn" onClick={() => toast.info('Document preview not available in this demo.')}>
                    View
                  </button>
                  <button className="download-btn" onClick={() => toast.info('Download not available in this demo.')}>
                    Download
                  </button>
                  <button className="delete-btn" onClick={() => handleDeleteDocument(doc.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Documents;
