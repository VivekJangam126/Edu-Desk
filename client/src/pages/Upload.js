import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import SearchableSelect from '../components/SearchableSelect';
import MultiSelect from '../components/MultiSelect';
import { Upload as UploadIcon, FileText, X, BookOpen } from 'lucide-react';

const Upload = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    collegeId: user?.collegeId || null,
    departmentId: user?.departmentId || null,
    educationYear: user?.educationYear || '',
    semester: user?.semester || '',
    subjectIds: []
  });
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Academic data states
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const navigate = useNavigate();

  // Fetch colleges on component mount
  useEffect(() => {
    fetchColleges();
  }, []);

  // Fetch departments when college changes
  useEffect(() => {
    if (formData.collegeId) {
      fetchDepartments(formData.collegeId);
      // Reset department and subjects when college changes
      if (formData.departmentId) {
        setFormData(prev => ({ ...prev, departmentId: null, subjectIds: [] }));
      }
    } else {
      setDepartments([]);
      setSubjects([]);
    }
  }, [formData.collegeId]);

  // Fetch subjects when department changes
  useEffect(() => {
    if (formData.departmentId) {
      fetchSubjects(formData.departmentId);
      // Reset subjects when department changes
      setFormData(prev => ({ ...prev, subjectIds: [] }));
    } else {
      setSubjects([]);
    }
  }, [formData.departmentId]);

  const fetchColleges = async () => {
    setLoadingColleges(true);
    try {
      const response = await axios.get('/api/academics/colleges');
      setColleges(response.data);
    } catch (error) {
      console.error('Error fetching colleges:', error);
      setError('Failed to load colleges. Please refresh the page.');
    } finally {
      setLoadingColleges(false);
    }
  };

  const fetchDepartments = async (collegeId) => {
    setLoadingDepartments(true);
    try {
      const response = await axios.get(`/api/academics/departments?collegeId=${collegeId}`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to load departments. Please try again.');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const fetchSubjects = async (departmentId) => {
    setLoadingSubjects(true);
    try {
      const response = await axios.get(`/api/academics/subjects?departmentId=${departmentId}`);
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Failed to load subjects. Please try again.');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAcademicChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) {
      setError('Please select a PDF file to upload');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a title for your note');
      return;
    }

    setLoading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      
      // Add academic metadata if provided
      if (formData.collegeId) uploadData.append('collegeId', formData.collegeId);
      if (formData.departmentId) uploadData.append('departmentId', formData.departmentId);
      if (formData.educationYear) uploadData.append('educationYear', formData.educationYear);
      if (formData.semester) uploadData.append('semester', formData.semester);
      if (formData.subjectIds.length > 0) {
        formData.subjectIds.forEach(subjectId => {
          uploadData.append('subjectIds[]', subjectId);
        });
      }

      const response = await axios.post('/api/notes', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Note uploaded successfully!');
      setTimeout(() => {
        navigate(`/notes/${response.data.noteId}`);
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Study Notes</h1>
        <p className="text-gray-600">
          Share your study materials with the community. Upload PDF files with a title and description.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PDF File *
          </label>
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-primary-400 bg-primary-50'
                : file
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center justify-center space-x-2">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-green-900">{file.name}</p>
                  <p className="text-xs text-green-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div>
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Drop your PDF here, or{' '}
                      <span className="text-primary-600 hover:text-primary-500">browse</span>
                    </span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf"
                      onChange={(e) => handleFileSelect(e.target.files[0])}
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">PDF files up to 10MB</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="input"
            placeholder="Enter a descriptive title for your notes"
            value={formData.title}
            onChange={handleChange}
            maxLength={200}
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.title.length}/200 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="input resize-none"
            placeholder="Provide additional details about your notes (optional)"
            value={formData.description}
            onChange={handleChange}
            maxLength={1000}
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.description.length}/1000 characters
          </p>
        </div>

        {/* Academic Metadata */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <BookOpen className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">Academic Information (Optional)</h3>
          </div>
          <p className="text-xs text-gray-600 mb-4">
            Help others find your notes by adding academic context
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                College/University
              </label>
              <SearchableSelect
                options={colleges}
                value={formData.collegeId}
                onChange={(value) => handleAcademicChange('collegeId', value)}
                placeholder="Select college"
                searchPlaceholder="Search colleges..."
                loading={loadingColleges}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <SearchableSelect
                options={departments}
                value={formData.departmentId}
                onChange={(value) => handleAcademicChange('departmentId', value)}
                placeholder="Select department"
                searchPlaceholder="Search departments..."
                loading={loadingDepartments}
                disabled={!formData.collegeId}
              />
              {!formData.collegeId && (
                <p className="mt-1 text-xs text-gray-500">Select a college first</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Education Year
              </label>
              <select
                name="educationYear"
                className="input"
                value={formData.educationYear}
                onChange={handleChange}
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester
              </label>
              <select
                name="semester"
                className="input"
                value={formData.semester}
                onChange={handleChange}
              >
                <option value="">Select Semester</option>
                {[1,2,3,4,5,6,7,8].map(sem => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subjects/Topics
            </label>
            <MultiSelect
              options={subjects}
              value={formData.subjectIds}
              onChange={(value) => handleAcademicChange('subjectIds', value)}
              placeholder="Select subjects"
              searchPlaceholder="Search subjects..."
              loading={loadingSubjects}
              disabled={!formData.departmentId}
              maxDisplay={3}
            />
            {!formData.departmentId && (
              <p className="mt-1 text-xs text-gray-500">Select a department first</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/notes')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !file || !formData.title.trim()}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Uploading...' : 'Upload Note'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Upload;