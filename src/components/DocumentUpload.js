import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { taxAPI } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

function DocumentUpload() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    documentType: 'Other',
    file: null
  });
  
  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);
  
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await taxAPI.getUserDocuments();
      setDocuments(response);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'file' && files.length > 0) {
      setFormData({
        ...formData,
        file: files[0]
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    setUploading(true);
    
    try {
      // Create FormData object for file upload
      const data = new FormData();
      data.append('document', formData.file);
      data.append('documentType', formData.documentType);
      
      // Upload document
      await taxAPI.uploadDocument(data);
      
      // Reset form
      setFormData({
        documentType: 'Other',
        file: null
      });
      
      // Clear file input
      document.getElementById('file-upload').value = '';
      
      toast.success('Document uploaded successfully');
      
      // Refresh document list
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };
  
  const handleDelete = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setLoading(true);
      try {
        await taxAPI.deleteDocument(documentId);
        toast.success('Document deleted successfully');
        
        // Refresh document list
        fetchDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Failed to delete document');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="document-upload-container">
      <h1>Document Management</h1>
      <p>Upload and manage your tax-related documents.</p>
      
      <div className="document-upload-content">
        <form onSubmit={handleSubmit} className="upload-form">
          <h2>Upload New Document</h2>
          
          <div className="form-group">
            <label htmlFor="documentType">Document Type</label>
            <select
              id="documentType"
              name="documentType"
              value={formData.documentType}
              onChange={handleChange}
              required
            >
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
              <option value="Receipt">Receipt</option>
              <option value="Invoice">Invoice</option>
              <option value="Statement">Statement</option>
              <option value="Tax Certificate">Tax Certificate</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="file-upload">Select File</label>
            <input
              type="file"
              id="file-upload"
              name="file"
              onChange={handleChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              required
            />
            <div className="file-info">
              {formData.file && (
                <span>
                  {formData.file.name} ({formatFileSize(formData.file.size)})
                </span>
              )}
            </div>
            <div className="file-help">
              Accepted formats: PDF, Word, Excel, and images (JPG, PNG)
            </div>
          </div>
          
          <button type="submit" disabled={uploading || !formData.file}>
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
        
        {(loading || uploading) && <LoadingSpinner />}
        
        <div className="documents-list">
          <h2>Your Documents</h2>
          
          {documents.length === 0 ? (
            <div className="no-documents">
              <p>You haven't uploaded any documents yet.</p>
            </div>
          ) : (
            <div className="document-items">
              {documents.map((doc) => (
                <div key={doc.id} className="document-item">
                  <div className="document-icon">
                    {doc.fileType.includes('pdf') ? '📄' :
                     doc.fileType.includes('word') ? '📝' :
                     doc.fileType.includes('excel') ? '📊' :
                     doc.fileType.includes('image') ? '🖼️' : '📎'}
                  </div>
                  <div className="document-details">
                    <div className="document-name">{doc.fileName}</div>
                    <div className="document-meta">
                      <span className="document-type">{doc.documentType}</span>
                      <span className="document-size">{formatFileSize(doc.fileSize)}</span>
                      <span className="document-date">{formatDate(doc.uploadDate)}</span>
                    </div>
                  </div>
                  <div className="document-actions">
                    <a 
                      href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/tax/document/${doc.id}`}
                      className="download-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(doc.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentUpload;
