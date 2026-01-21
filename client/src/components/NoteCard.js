import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageCircle, User, Calendar, GraduationCap, BookOpen, Hash } from 'lucide-react';

const NoteCard = ({ note }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current opacity-50" />
        );
      } else {
        stars.push(
          <Star key={i} className="h-4 w-4 text-gray-300" />
        );
      }
    }
    return stars;
  };

  return (
    <div className="card card-hover">
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {note.title}
          </h3>
          
          {note.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">
              {note.description}
            </p>
          )}

          {/* Academic Metadata */}
          {(note.college || note.department || note.education_year || note.semester || note.subjects?.length > 0) && (
            <div className="mb-3 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-1">
                <GraduationCap className="h-3 w-3 text-gray-500 mr-1" />
                <span className="text-xs font-medium text-gray-600">Academic Info</span>
              </div>
              
              <div className="space-y-1 text-xs text-gray-600">
                {note.college && (
                  <div className="flex items-center">
                    <BookOpen className="h-3 w-3 mr-1" />
                    <span className="truncate">{note.college}</span>
                  </div>
                )}
                
                {note.department && (
                  <div className="flex items-center">
                    <span className="w-3 text-center mr-1">📚</span>
                    <span className="truncate">{note.department}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  {note.education_year && (
                    <span>Year {note.education_year}</span>
                  )}
                  {note.semester && (
                    <span>Sem {note.semester}</span>
                  )}
                </div>
                
                {note.subjects && note.subjects.length > 0 && (
                  <div className="flex items-start">
                    <Hash className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {note.subjects.slice(0, 3).map((subject, index) => (
                        <span
                          key={index}
                          className="inline-block px-1 py-0.5 bg-primary-100 text-primary-700 rounded text-xs"
                        >
                          {subject}
                        </span>
                      ))}
                      {note.subjects.length > 3 && (
                        <span className="text-gray-500">+{note.subjects.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{note.uploader_name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(note.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-1">
              {renderStars(note.avg_rating)}
              <span className="text-sm text-gray-600 ml-1">
                ({note.rating_count})
              </span>
            </div>
            <div className="flex items-center space-x-1 text-gray-500">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{note.comment_count}</span>
            </div>
          </div>
        </div>

        <Link 
          to={`/notes/${note.id}`}
          className="btn btn-primary w-full text-center"
        >
          View Note
        </Link>
      </div>
    </div>
  );
};

export default NoteCard;