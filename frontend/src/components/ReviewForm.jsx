import React, { useState } from 'react';
import '../App.css';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const ReviewForm = ({ id, onReviewAdded }) => {
  // State for the review text input
  const [reviewText, setReviewText] = useState('');
  // State for the star rating (1 to 5)
  const [stars, setStars] = useState(5);
  // State for handling loading status during submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State for error messages
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic validation: check if review text is empty
    if (!reviewText.trim()) {
      setError('Review text is required.');
      return;
    }

    // Retrieve the auth token from localStorage 
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to submit a review.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send POST request to the backend review route
      const response = await fetch(`${API_URL}/movies/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          review_text: reviewText,
          stars: Number(stars)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      // Reset form fields upon successful submission
      setReviewText('');
      setStars(5);

      // Notify parent component to update/refresh the review list
      if (onReviewAdded) {
        onReviewAdded(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="review-form-container">
      <h4>Write a Review</h4>
      
      {error && <div className="review-error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="review-form">
        {/* Star Rating Selection */}
        <div className="form-group">
          <label htmlFor="stars">Rating (1-5 stars):</label>
          <select 
            id="stars" 
            value={stars} 
            onChange={(e) => setStars(Number(e.target.value))}
            disabled={isSubmitting}
          >
            <option value={5}>★★★★★ (5 Stars)</option>
            <option value={4}>★★★★☆ (4 Stars)</option>
            <option value={3}>★★★☆☆ (3 Stars)</option>
            <option value={2}>★★☆☆☆ (2 Stars)</option>
            <option value={1}>★☆☆☆☆ (1 Star)</option>
          </select>
        </div>

        {/* Review Text Input */}
        <div className="form-group">
          <label htmlFor="reviewText">Your Review:</label>
          <textarea
            id="reviewText"
            rows="4"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Write your thoughts about the movie here..."
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-review-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Post Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;