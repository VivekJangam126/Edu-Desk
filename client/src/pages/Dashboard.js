import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import NoteCard from '../components/NoteCard';
import { 
  BarChart3, 
  Upload, 
  Heart, 
  MessageCircle, 
  FileText,
  TrendingUp,
  Calendar,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, uploadsRes, favoritesRes] = await Promise.all([
        axios.get('/api/users/analytics'),
        axios.get('/api/users/uploads'),
        axios.get('/api/users/favorites')
      ]);

      setAnalytics(analyticsRes.data);
      setUploads(uploadsRes.data);
      setFavorites(favoritesRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of your activity on Edu-Desk.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="bg-primary-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Your Uploads</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.stats?.user_uploads || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-lg">
              <Heart className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Favorites</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.stats?.user_favorites || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Comments</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.stats?.user_comments || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Notes</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.stats?.total_notes || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/upload" className="btn btn-primary">
            <Upload className="h-4 w-4 mr-2" />
            Upload New Note
          </Link>
          <Link to="/notes" className="btn btn-outline">
            <FileText className="h-4 w-4 mr-2" />
            Browse All Notes
          </Link>
          <Link to="/profile" className="btn btn-outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Profile
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="h-4 w-4 inline mr-2" />
            Recent Activity
          </button>
          <button
            onClick={() => setActiveTab('uploads')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'uploads'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Upload className="h-4 w-4 inline mr-2" />
            My Uploads ({uploads.length})
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'favorites'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Heart className="h-4 w-4 inline mr-2" />
            Favorites ({favorites.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {analytics?.activity && analytics.activity.length > 0 ? (
            <div className="space-y-3">
              {analytics.activity.map((item, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {item.type === 'upload' ? (
                      <Upload className="h-5 w-5 text-primary-600" />
                    ) : (
                      <MessageCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {formatDate(item.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400 mt-1">
                Start by uploading a note or commenting on existing ones!
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'uploads' && (
        <div>
          {uploads.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {uploads.map(note => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No uploads yet</h3>
              <p className="text-gray-600 mb-4">
                Share your first study note with the community!
              </p>
              <Link to="/upload" className="btn btn-primary">
                Upload Your First Note
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <div>
          {favorites.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map(note => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
              <p className="text-gray-600 mb-4">
                Explore notes and save your favorites for easy access!
              </p>
              <Link to="/notes" className="btn btn-primary">
                Browse Notes
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;