import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { taxAPI } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

function DocumentUpload() {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('Income');
  const [year, setYear] = useState(new Date().getFullYear());
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { currentUser } = useAuth();

  // Document categories
  const categories = [
    'Income',
    'Expenses',
    'Deductions',
    'Tax Credits',
    'Pension',
    'Medical',
    'Property',
    'Other'
  ];

  // Years for dropdown (last 5 years)
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await taxAPI.getUserDocuments();
      if (response && response.data) {
        setDocuments(response.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds the 10MB limit.');
        e.target.value = null;
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Invalid file type. Only PDF, images, and Office documents are allowed.');
        e.target.value = null;
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.warning('Please select a file to upload.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('year', year);

    try {
      const response = await taxAPI.uploadDocument(formData);
      
      if (response && response.data) {
        toast.success('Document uploaded successfully!');
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
        // Refresh documents list
        fetchDocuments();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload document. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (documentId) => {
    try {
      await taxAPI.downloadDocument(documentId);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document. Please try again later.');
    }
  };

  const handleDelete = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      try {
        const response = await taxAPI.deleteDocument(documentId);
        
        if (response && response.success) {
          toast.success('Document deleted successfully!');
          // Update documents list
          setDocuments(documents.filter(doc => doc.id !== documentId));
        }
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Failed to delete document. Please try again later.');
      }
    }
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IE', options);
  };

  // Get file icon based on mimetype
  const getFileIcon = (mimetype) => {
    if (mimetype.includes('pdf')) {
      return 'fa-file-pdf';
    } else if (mimetype.includes('image')) {
      return 'fa-file-image';
    } else if (mimetype.includes('word')) {
      return 'fa-file-word';
    } else if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) {
      return 'fa-file-excel';
    } else {
      return 'fa-file';
    }
  };

  return (
    <div className="document-upload-container">
      <h1>Document Upload</h1>
      <p className="description">
        Upload tax-related documents such as income statements, receipts for deductions, and other supporting documentation.
      </p>

      <div className="document-upload-content">
        <div className="upload-form-container">
          <h2>Upload New Document</h2>
          <form onSubmit={handleUpload} className="upload-form">
            <div className="form-group">
              <label htmlFor="file-upload">Select File:</label>
              <div className="file-input-container">
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  className="file-input"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                />
                <div className="file-input-info">
                  {file ? (
                    <div className="selected-file">
                      <i className={`fas ${getFileIcon(file.type)}`}></i>
                      <span>{file.name}</span>
                      <span className="file-size">({formatFileSize(file.size)})</span>
                    </div>
                  ) : (
                    <div className="no-file">No file selected</div>
                  )}
                </div>
              </div>
              <div className="file-requirements">
                <p>Accepted formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX</p>
                <p>Maximum file size: 10MB</p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="category">Category:</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="year">Tax Year:</label>
              <select
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="form-select"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="upload-btn"
              disabled={!file || uploading}
            >
              {uploading ? (
                <>
                  <LoadingSpinner size="small" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-cloud-upload-alt"></i>
                  <span>Upload Document</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="documents-list-container">
          <h2>Your Documents</h2>
          {loading ? (
            <div className="loading-container">
              <LoadingSpinner />
              <p>Loading your documents...</p>
            </div>
          ) : (
            <div className="documents-list">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <div key={doc.id} className="document-item">
                    <div className="document-icon">
                      <i className={`fas ${getFileIcon(doc.mimetype)}`}></i>
                    </div>
                    <div className="document-details">
                      <div className="document-name">{doc.filename}</div>
                      <div className="document-meta">
                        <span className="document-category">{doc.category}</span>
                        <span className="document-year">{doc.year}</span>
                        <span className="document-size">{formatFileSize(doc.size)}</span>
                        <span className="document-date">Uploaded: {formatDate(doc.uploadDate)}</span>
                      </div>
                    </div>
                    <div className="document-actions">
                      <button
                        className="action-btn download-btn"
                        onClick={() => handleDownload(doc.id)}
                        title="Download"
                      >
                        <i className="fas fa-download"></i>
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(doc.id)}
                        title="Delete"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-documents">
                  <i className="fas fa-folder-open"></i>
                  <p>No documents uploaded yet.</p>
                  <p>Upload your first document to get started!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="document-security-info">
        <h3>Document Security Information</h3>
        <div className="security-details">
          <div className="security-item">
            <i className="fas fa-lock"></i>
            <div>
              <h4>Private & Secure</h4>
              <p>Your documents are stored securely and are only accessible to you.</p>
            </div>
          </div>
          <div className="security-item">
            <i className="fas fa-shield-alt"></i>
            <div>
              <h4>Encrypted Storage</h4>
              <p>All documents are encrypted at rest and during transmission.</p>
            </div>
          </div>
          <div className="security-item">
            <i className="fas fa-user-lock"></i>
            <div>
              <h4>Access Control</h4>
              <p>Only you can view, download, or delete your documents.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentUpload;
