import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  Star, 
  MessageCircle, 
  Heart, 
  User, 
  Calendar, 
  Download,
  ArrowLeft,
  Send
} from 'lucide-react';

const NoteDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    try {
      const response = await axios.get(`/api/notes/${id}`);
      setNote(response.data);
      
      // Check if user has favorited this note
      if (user) {
        checkFavoriteStatus();
        checkUserRating();
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const response = await axios.get('/api/users/favorites');
      const favorited = response.data.some(fav => fav.id === parseInt(id));
      setIsFavorited(favorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const checkUserRating = async () => {
    // This would require a new endpoint to get user's rating for a specific note
    // For now, we'll skip this implementation
  };

  const handleRating = async (rating) => {
    if (!user || submittingRating) return;
    
    setSubmittingRating(true);
    try {
      await axios.post(`/api/notes/${id}/rating`, { rating });
      setUserRating(rating);
      // Refresh note to get updated average rating
      fetchNote();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) return;
    
    try {
      const response = await axios.post(`/api/notes/${id}/favorite`);
      setIsFavorited(response.data.favorited);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user || !comment.trim() || submittingComment) return;
    
    setSubmittingComment(true);
    try {
      await axios.post(`/api/notes/${id}/comments`, { text: comment });
      setComment('');
      // Refresh note to get updated comments
      fetchNote();
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating, interactive = false, onStarClick = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          disabled={!interactive || submittingRating}
          onClick={() => interactive && onStarClick && onStarClick(i)}
          className={`${
            interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          } transition-transform`}
        >
          <Star
            className={`h-5 w-5 ${
              i <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        </button>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Note not found</h1>
          <Link to="/notes" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Notes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link to="/notes" className="inline-flex items-center text-primary-600 hover:text-primary-700">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Notes
        </Link>
      </div>

      {/* Note Header */}
      <div className="card mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{note.title}</h1>
            
            {note.description && (
              <p className="text-gray-600 mb-4">{note.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{note.uploader_name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(note.created_at)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  {renderStars(note.avg_rating)}
                  <span className="text-sm text-gray-600 ml-2">
                    ({note.rating_count} {note.rating_count === 1 ? 'rating' : 'ratings'})
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-gray-500">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">{note.comments?.length || 0} comments</span>
                </div>
              </div>

              {user && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleFavorite}
                    className={`btn ${
                      isFavorited 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'btn-outline'
                    }`}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${isFavorited ? 'fill-current' : ''}`} />
                    {isFavorited ? 'Favorited' : 'Favorite'}
                  </button>
                  <a
                    href={`http://localhost:5000${note.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Document Preview</h2>
        <div className="bg-gray-100 rounded-lg p-4">
          <iframe
            src={`http://localhost:5000${note.file_url}`}
            className="w-full h-96 border-0 rounded"
            title={note.title}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Having trouble viewing? <a 
            href={`http://localhost:5000${note.file_url}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700"
          >
            Open in new tab
          </a>
        </p>
      </div>

      {/* Rating Section */}
      {user && (
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate this note</h3>
          <div className="flex items-center space-x-2">
            {renderStars(userRating, true, handleRating)}
            <span className="text-sm text-gray-600 ml-2">
              {userRating > 0 ? `You rated this ${userRating} star${userRating !== 1 ? 's' : ''}` : 'Click to rate'}
            </span>
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Comments ({note.comments?.length || 0})
        </h3>

        {/* Add Comment Form */}
        {user ? (
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <div className="flex space-x-3">
              <div className="flex-1">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="input resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <button
                type="submit"
                disabled={!comment.trim() || submittingComment}
                className="btn btn-primary h-fit disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">{comment.length}/500 characters</p>
          </form>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-600">
              <Link to="/login" className="text-primary-600 hover:text-primary-700">
                Sign in
              </Link> to add comments and rate this note.
            </p>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {note.comments && note.comments.length > 0 ? (
            note.comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{comment.user_name}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-gray-700">{comment.text}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">
              No comments yet. Be the first to share your thoughts!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteDetail;