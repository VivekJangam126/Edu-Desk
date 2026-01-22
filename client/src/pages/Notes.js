import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import NoteCard from '../components/NoteCard';
import SearchableSelect from '../components/SearchableSelect';
import MultiSelect from '../components/MultiSelect';
import { Search, Filter, ToggleLeft, ToggleRight, X } from 'lucide-react';

const Notes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showRecommended, setShowRecommended] = useState(user?.role === 'student');
  const [filters, setFilters] = useState({
    collegeId: null,
    departmentId: null,
    educationYear: '',
    semester: '',
    subjectIds: []
  });
  const [academicData, setAcademicData] = useState({
    colleges: [],
    departments: [],
    subjects: []
  });
  const [loadingAcademics, setLoadingAcademics] = useState({
    colleges: false,
    departments: false,
    subjects: false
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchNotes();
    fetchColleges();
  }, [showRecommended, filters]);

  // Fetch departments when college changes
  useEffect(() => {
    if (filters.collegeId) {
      fetchDepartments(filters.collegeId);
      // Reset department and subjects when college changes
      if (filters.departmentId) {
        setFilters(prev => ({ ...prev, departmentId: null, subjectIds: [] }));
      }
    } else {
      setAcademicData(prev => ({ ...prev, departments: [], subjects: [] }));
    }
  }, [filters.collegeId]);

  // Fetch subjects when department changes
  useEffect(() => {
    if (filters.departmentId) {
      fetchSubjects(filters.departmentId);
      // Reset subjects when department changes
      setFilters(prev => ({ ...prev, subjectIds: [] }));
    } else {
      setAcademicData(prev => ({ ...prev, subjects: [] }));
    }
  }, [filters.departmentId]);

  const fetchNotes = async () => {
    try {
      const params = new URLSearchParams();
      
      if (showRecommended && user?.role === 'student') {
        params.append('recommended', 'true');
      }
      
      // Add manual filters
      if (filters.collegeId) params.append('collegeId', filters.collegeId);
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.educationYear) params.append('educationYear', filters.educationYear);
      if (filters.semester) params.append('semester', filters.semester);
      if (filters.subjectIds.length > 0) {
        filters.subjectIds.forEach(subjectId => {
          params.append('subjectIds[]', subjectId);
        });
      }

      const response = await axios.get(`/api/notes?${params.toString()}`);
      // Ensure response.data is an array
      const notesData = Array.isArray(response.data) ? response.data : [];
      setNotes(notesData);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setNotes([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchColleges = async () => {
    setLoadingAcademics(prev => ({ ...prev, colleges: true }));
    try {
      const response = await axios.get('/api/academics/colleges');
      // Ensure response.data is an array
      const collegesData = Array.isArray(response.data) ? response.data : [];
      setAcademicData(prev => ({ ...prev, colleges: collegesData }));
    } catch (error) {
      console.error('Error fetching colleges:', error);
      setAcademicData(prev => ({ ...prev, colleges: [] }));
    } finally {
      setLoadingAcademics(prev => ({ ...prev, colleges: false }));
    }
  };

  const fetchDepartments = async (collegeId) => {
    setLoadingAcademics(prev => ({ ...prev, departments: true }));
    try {
      const response = await axios.get(`/api/academics/departments?collegeId=${collegeId}`);
      // Ensure response.data is an array
      const departmentsData = Array.isArray(response.data) ? response.data : [];
      setAcademicData(prev => ({ ...prev, departments: departmentsData }));
    } catch (error) {
      console.error('Error fetching departments:', error);
      setAcademicData(prev => ({ ...prev, departments: [] }));
    } finally {
      setLoadingAcademics(prev => ({ ...prev, departments: false }));
    }
  };

  const fetchSubjects = async (departmentId) => {
    setLoadingAcademics(prev => ({ ...prev, subjects: true }));
    try {
      const response = await axios.get(`/api/academics/subjects?departmentId=${departmentId}`);
      // Ensure response.data is an array
      const subjectsData = Array.isArray(response.data) ? response.data : [];
      setAcademicData(prev => ({ ...prev, subjects: subjectsData }));
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setAcademicData(prev => ({ ...prev, subjects: [] }));
    } finally {
      setLoadingAcademics(prev => ({ ...prev, subjects: false }));
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      collegeId: null,
      departmentId: null,
      educationYear: '',
      semester: '',
      subjectIds: []
    });
  };

  const hasActiveFilters = filters.collegeId || filters.departmentId || filters.educationYear || filters.semester || filters.subjectIds.length > 0;

  const filteredAndSortedNotes = notes
    .filter(note => 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.uploader_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'rating':
          return b.avg_rating - a.avg_rating;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Study Notes</h1>
        <p className="text-gray-600">
          Discover and explore educational materials shared by the community.
        </p>
      </div>

      {/* Toggle System for Students */}
      {user?.role === 'student' && (
        <div className="mb-6 flex items-center justify-center">
          <div className="bg-white rounded-lg border border-gray-200 p-1 flex">
            <button
              onClick={() => setShowRecommended(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showRecommended
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Recommended for Me
            </button>
            <button
              onClick={() => setShowRecommended(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !showRecommended
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Notes
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search notes, descriptions, or authors..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <select
              className="input appearance-none bg-white"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating">Highest Rated</option>
              <option value="title">Alphabetical</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'} flex items-center`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {Object.values(filters).filter(v => v).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filter Notes</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  College/University
                </label>
                <SearchableSelect
                  options={academicData.colleges}
                  value={filters.collegeId}
                  onChange={(value) => handleFilterChange('collegeId', value)}
                  placeholder="All Colleges"
                  searchPlaceholder="Search colleges..."
                  loading={loadingAcademics.colleges}
                  allowClear={true}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <SearchableSelect
                  options={academicData.departments}
                  value={filters.departmentId}
                  onChange={(value) => handleFilterChange('departmentId', value)}
                  placeholder="All Departments"
                  searchPlaceholder="Search departments..."
                  loading={loadingAcademics.departments}
                  disabled={!filters.collegeId}
                  allowClear={true}
                />
                {!filters.collegeId && (
                  <p className="mt-1 text-xs text-gray-500">Select a college first</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Education Year
                </label>
                <select
                  className="input"
                  value={filters.educationYear}
                  onChange={(e) => handleFilterChange('educationYear', e.target.value)}
                >
                  <option value="">All Years</option>
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
                  className="input"
                  value={filters.semester}
                  onChange={(e) => handleFilterChange('semester', e.target.value)}
                >
                  <option value="">All Semesters</option>
                  {[1,2,3,4,5,6,7,8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subjects/Topics
                </label>
                <MultiSelect
                  options={academicData.subjects}
                  value={filters.subjectIds}
                  onChange={(value) => handleFilterChange('subjectIds', value)}
                  placeholder="All Subjects"
                  searchPlaceholder="Search subjects..."
                  loading={loadingAcademics.subjects}
                  disabled={!filters.departmentId}
                  maxDisplay={2}
                />
                {!filters.departmentId && (
                  <p className="mt-1 text-xs text-gray-500">Select a department first</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600">
          {filteredAndSortedNotes.length} {filteredAndSortedNotes.length === 1 ? 'note' : 'notes'} found
          {showRecommended && user?.role === 'student' && (
            <span className="ml-2 text-sm text-primary-600">(recommended for you)</span>
          )}
        </p>
        
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.collegeId && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                College: {academicData.colleges.find(c => c.id === filters.collegeId)?.name}
                <button
                  onClick={() => handleFilterChange('collegeId', null)}
                  className="ml-1 text-primary-600 hover:text-primary-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.departmentId && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Department: {academicData.departments.find(d => d.id === filters.departmentId)?.name}
                <button
                  onClick={() => handleFilterChange('departmentId', null)}
                  className="ml-1 text-primary-600 hover:text-primary-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.educationYear && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Year: {filters.educationYear}
                <button
                  onClick={() => handleFilterChange('educationYear', '')}
                  className="ml-1 text-primary-600 hover:text-primary-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.semester && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Semester: {filters.semester}
                <button
                  onClick={() => handleFilterChange('semester', '')}
                  className="ml-1 text-primary-600 hover:text-primary-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.subjectIds.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Subjects: {filters.subjectIds.length} selected
                <button
                  onClick={() => handleFilterChange('subjectIds', [])}
                  className="ml-1 text-primary-600 hover:text-primary-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Notes Grid */}
      {filteredAndSortedNotes.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedNotes.map(note => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notes found</h3>
          <p className="text-gray-600">
            {searchTerm || hasActiveFilters
              ? 'Try adjusting your search terms or filters.'
              : 'No study notes have been uploaded yet. Be the first to share!'
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 btn btn-outline"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Notes;