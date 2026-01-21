import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import SearchableSelect from '../components/SearchableSelect';
import { BookOpen, Eye, EyeOff, User, GraduationCap } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    collegeId: null,
    departmentId: null,
    educationYear: '',
    semester: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Academic data states
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Fetch colleges on component mount
  useEffect(() => {
    fetchColleges();
  }, []);

  // Fetch departments when college changes
  useEffect(() => {
    if (formData.collegeId) {
      fetchDepartments(formData.collegeId);
      // Reset department when college changes
      if (formData.departmentId) {
        setFormData(prev => ({ ...prev, departmentId: null }));
      }
    } else {
      setDepartments([]);
    }
  }, [formData.collegeId]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAcademicChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Validate academic fields for students
    if (formData.role === 'student') {
      if (!formData.collegeId || !formData.departmentId || !formData.educationYear || !formData.semester) {
        setError('All academic fields are required for students');
        return;
      }
    }

    setLoading(true);

    const result = await register(
      formData.email, 
      formData.name, 
      formData.password,
      formData.role,
      formData.collegeId,
      formData.departmentId,
      formData.educationYear ? parseInt(formData.educationYear) : null,
      formData.semester ? parseInt(formData.semester) : null
    );
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <BookOpen className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="input mt-1"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input mt-1"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, role: 'student'})}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    formData.role === 'student'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <GraduationCap className="h-6 w-6 mx-auto mb-1" />
                  <span className="text-sm font-medium">Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, role: 'educator'})}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    formData.role === 'educator'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <User className="h-6 w-6 mx-auto mb-1" />
                  <span className="text-sm font-medium">Educator</span>
                </button>
              </div>
            </div>

            {/* Academic Fields for Students */}
            {formData.role === 'student' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700">Academic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    College/University
                  </label>
                  <SearchableSelect
                    options={colleges}
                    value={formData.collegeId}
                    onChange={(value) => handleAcademicChange('collegeId', value)}
                    placeholder="Select your college"
                    searchPlaceholder="Search colleges..."
                    loading={loadingColleges}
                    required={formData.role === 'student'}
                    error={formData.role === 'student' && !formData.collegeId ? 'College is required' : null}
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
                    placeholder="Select your department"
                    searchPlaceholder="Search departments..."
                    loading={loadingDepartments}
                    disabled={!formData.collegeId}
                    required={formData.role === 'student'}
                    error={formData.role === 'student' && !formData.departmentId ? 'Department is required' : null}
                  />
                  {!formData.collegeId && (
                    <p className="mt-1 text-xs text-gray-500">Select a college first</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="educationYear" className="block text-sm font-medium text-gray-700">
                      Year
                    </label>
                    <select
                      id="educationYear"
                      name="educationYear"
                      required={formData.role === 'student'}
                      className="input mt-1"
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
                    <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                      Semester
                    </label>
                    <select
                      id="semester"
                      name="semester"
                      required={formData.role === 'student'}
                      className="input mt-1"
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
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input pr-10"
                  placeholder="Create a password (min. 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="input mt-1"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;