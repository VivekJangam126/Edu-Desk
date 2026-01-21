# API Reference

This document describes the REST API endpoints for the Edu-Desk platform.

## Base URL
```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

#### POST /auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

### Notes

#### GET /notes
Get all notes with ratings and comments count.

**Response:**
```json
[
  {
    "id": 1,
    "title": "Introduction to React",
    "description": "Basic React concepts and examples",
    "file_url": "/uploads/file.pdf",
    "file_name": "react-intro.pdf",
    "uploaded_by": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "uploader_name": "John Doe",
    "avg_rating": 4.5,
    "rating_count": 10,
    "comment_count": 5
  }
]
```

#### GET /notes/:id
Get a specific note with comments.

**Response:**
```json
{
  "id": 1,
  "title": "Introduction to React",
  "description": "Basic React concepts and examples",
  "file_url": "/uploads/file.pdf",
  "file_name": "react-intro.pdf",
  "uploaded_by": 1,
  "created_at": "2024-01-01T00:00:00.000Z",
  "uploader_name": "John Doe",
  "avg_rating": 4.5,
  "rating_count": 10,
  "comments": [
    {
      "id": 1,
      "note_id": 1,
      "user_id": 2,
      "text": "Great notes!",
      "created_at": "2024-01-01T00:00:00.000Z",
      "user_name": "Jane Smith"
    }
  ]
}
```

#### POST /notes
Upload a new note (requires authentication).

**Request:** Multipart form data
- `file`: PDF file
- `title`: Note title
- `description`: Note description (optional)

**Response:**
```json
{
  "message": "Note uploaded successfully",
  "noteId": 1
}
```

#### POST /notes/:id/comments
Add a comment to a note (requires authentication).

**Request Body:**
```json
{
  "text": "This is a helpful note!"
}
```

**Response:**
```json
{
  "message": "Comment added successfully",
  "commentId": 1
}
```

#### POST /notes/:id/rating
Rate a note (requires authentication).

**Request Body:**
```json
{
  "rating": 5
}
```

**Response:**
```json
{
  "message": "Rating added successfully"
}
```

#### POST /notes/:id/favorite
Toggle favorite status for a note (requires authentication).

**Response:**
```json
{
  "message": "Added to favorites",
  "favorited": true
}
```

### Users

#### GET /users/profile
Get current user profile (requires authentication).

**Response:**
```json
{
  "id": 1,
  "email": "john@example.com",
  "name": "John Doe",
  "created_at": "2024-01-01T00:00:00.000Z",
  "total_uploads": 5,
  "total_favorites": 10,
  "total_comments": 15
}
```

#### GET /users/uploads
Get current user's uploaded notes (requires authentication).

**Response:**
```json
[
  {
    "id": 1,
    "title": "My Note",
    "description": "Description",
    "file_url": "/uploads/file.pdf",
    "file_name": "note.pdf",
    "uploaded_by": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "avg_rating": 4.0,
    "rating_count": 5,
    "comment_count": 3
  }
]
```

#### GET /users/favorites
Get current user's favorite notes (requires authentication).

**Response:**
```json
[
  {
    "id": 1,
    "title": "Favorite Note",
    "description": "Description",
    "file_url": "/uploads/file.pdf",
    "file_name": "note.pdf",
    "uploaded_by": 2,
    "created_at": "2024-01-01T00:00:00.000Z",
    "uploader_name": "Jane Smith",
    "avg_rating": 4.5,
    "rating_count": 8,
    "comment_count": 4
  }
]
```

#### GET /users/analytics
Get dashboard analytics for current user (requires authentication).

**Response:**
```json
{
  "stats": {
    "total_notes": 100,
    "user_uploads": 5,
    "user_favorites": 10,
    "user_comments": 15
  },
  "activity": [
    {
      "type": "upload",
      "title": "New Note Title",
      "date": "2024-01-01T00:00:00.000Z"
    },
    {
      "type": "comment",
      "title": "Comment on: Some Note",
      "date": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting:
- 100 requests per 15 minutes per IP address
- Exceeded limits return `429 Too Many Requests`

## File Upload Limits

- Maximum file size: 10MB
- Allowed file types: PDF only
- Files are stored in `/uploads` directory