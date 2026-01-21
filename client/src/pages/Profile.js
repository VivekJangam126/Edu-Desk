import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import SearchableSelect from '../components/SearchableSelect';
import { User, Mail, Calendar, FileText, Heart, MessageCircle, Edit3, Save, X, GraduationCap } from 'lucide-react';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Academic data states
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchColleges();
  }, []);

  // Fetch departments when college changes in edit form
  useEffect(() => {
    if (editForm.collegeId) {
      fetchDepartments(editForm.collegeId);
    } else {
      setDepartments([]);
    }
  }, [editForm.collegeId]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/users/profile');
      setProfile(response.data);
      setEditForm({
        name: response.data.name,
        role: response.data.role || 'student',
        collegeId: response.data.collegeId || null,
        departmentId: response.data.departmentId || null,
        educationYear: response.data.educationYear || '',
        semester: response.data.semester || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchColleges = async () => {
    setLoadingColleges(true);
    try {
      const response = await axios.get('/api/academics/colleges');
      setColleges(response.data);
    } catch (error) {
      console.error('Error fetching colleges:', error);
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
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAcademicChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    // Validate academic fields for students
    if (editForm.role === 'student') {
      if (!editForm.collegeId || !editForm.departmentId || !editForm.educationYear || !editForm.semester) {
        setError('All academic fields are required for students');
        setSaving(false);
        return;
      }
    }

    try {
      await axios.put('/api/users/profile', {
        name: editForm.name,
        role: editForm.role,
        collegeId: editForm.collegeId || null,
        departmentId: editForm.departmentId || null,
        educationYear: editForm.educationYear ? parseInt(editForm.educationYear) : null,
        semester: editForm.semester ? parseInt(editForm.semester) : null
      });

      // Update local user state
      setUser(prev => ({
        ...prev,
        name: editForm.name,
        role: editForm.role,
        collegeId: editForm.collegeId,
        departmentId: editForm.departmentId,
        educationYear: editForm.educationYear,
        semester: editForm.semester
      }));

      setSuccess('Profile updated successfully!');
      setEditing(false);
      fetchProfile(); // Refresh profile data
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setSuccess('');
    // Reset form to original values
    setEditForm({
      name: profile.name,
      role: profile.role || 'student',
      collegeId: profile.collegeId || null,
      departmentId: profile.departmentId || null,
      educationYear: profile.educationYear || '',
      semester: profile.semester || ''
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile</h1>
        <p className="text-gray-600">
          Manage your account information and view your activity summary.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Profile Information */}
      <div className="card mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-6">
            <div className="bg-primary-100 p-6 rounded-full">
              <User className="h-12 w-12 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{profile.name}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  profile.role === 'educator' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {profile.role === 'educator' ? 'Educator' : 'Student'}
                </span>
                <span>Member since {formatDate(profile.created_at)}</span>
              </div>
            </div>
          </div>
          
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn btn-outline flex items-center"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  className="input"
                  value={editForm.name}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  className="input"
                  value={editForm.role}
                  onChange={handleEditChange}
                >
                  <option value="student">Student</option>
                  <option value="educator">Educator</option>
                </select>
              </div>
            </div>

            {editForm.role === 'student' && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Academic Information
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      College/University
                    </label>
                    <SearchableSelect
                      options={colleges}
                      value={editForm.collegeId}
                      onChange={(value) => handleAcademicChange('collegeId', value)}
                      placeholder="Select college"
                      searchPlaceholder="Search colleges..."
                      loading={loadingColleges}
                      required={editForm.role === 'student'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <SearchableSelect
                      options={departments}
                      value={editForm.departmentId}
                      onChange={(value) => handleAcademicChange('departmentId', value)}
                      placeholder="Select department"
                      searchPlaceholder="Search departments..."
                      loading={loadingDepartments}
                      disabled={!editForm.collegeId}
                      required={editForm.role === 'student'}
                    />
                    {!editForm.collegeId && editForm.role === 'student' && (
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
                      value={editForm.educationYear}
                      onChange={handleEditChange}
                      required={editForm.role === 'student'}
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
                      value={editForm.semester}
                      onChange={handleEditChange}
                      required={editForm.role === 'student'}
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

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="btn btn-secondary flex items-center"
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary flex items-center"
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-gray-900">{profile.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Member since</p>
                  <p className="text-gray-900">{formatDate(profile.created_at)}</p>
                </div>
              </div>
            </div>

            {profile.role === 'student' && (profile.collegeName || profile.departmentName) && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Academic Information
                </h3>
                
                {profile.collegeName && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">College</p>
                    <p className="text-gray-900">{profile.collegeName}</p>
                  </div>
                )}
                
                {profile.departmentName && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Department</p>
                    <p className="text-gray-900">{profile.departmentName}</p>
                  </div>
                )}
                
                <div className="flex space-x-6">
                  {profile.educationYear && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Year</p>
                      <p className="text-gray-900">{profile.educationYear}</p>
                    </div>
                  )}
                  
                  {profile.semester && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Semester</p>
                      <p className="text-gray-900">{profile.semester}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activity Statistics */}
      <div className="card mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Activity Summary</h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-primary-50 rounded-lg">
            <FileText className="h-8 w-8 text-primary-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-primary-600 mb-1">
              {profile.total_uploads}
            </p>
            <p className="text-sm font-medium text-gray-600">
              Notes Uploaded
            </p>
          </div>
          
          <div className="text-center p-6 bg-red-50 rounded-lg">
            <Heart className="h-8 w-8 text-red-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-red-600 mb-1">
              {profile.total_favorites}
            </p>
            <p className="text-sm font-medium text-gray-600">
              Notes Favorited
            </p>
          </div>
          
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <MessageCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-green-600 mb-1">
              {profile.total_comments}
            </p>
            <p className="text-sm font-medium text-gray-600">
              Comments Made
            </p>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Actions</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Change Password</h4>
              <p className="text-sm text-gray-600">Update your account password</p>
            </div>
            <button className="btn btn-outline">
              Change Password
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <h4 className="font-medium text-red-900">Delete Account</h4>
              <p className="text-sm text-red-600">Permanently delete your account and all data</p>
            </div>
            <button className="btn bg-red-600 text-white hover:bg-red-700">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;