import React from 'react';
import '../App.css';

const ReviewList = ({ reviews }) => {
  // stars（eg：★★★★☆）
  const renderStars = (count) => {
    const totalStars = 5;
    return '★'.repeat(count) + '☆'.repeat(totalStars - count);
  };

  // format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' ,timeZone: 'Europe/Helsinki'};
    return new Date(dateString).toLocaleDateString('fi-FI', options);
  };

  // empty state if no reviews
  if (!reviews || reviews.length === 0) {
    return (
      <div className="review-list-empty">
        <p>No reviews yet. Be the first to write a review!</p>
      </div>
    );
  }

  return (
    <div className="review-list-container">
      <h3>Movie Reviews ({reviews.length})</h3>
      
      <div className="reviews-container">
        {reviews.map((review) => (
          <div key={review.review_id} className="review-card">
            <div className="review-header">
              <span className="review-username">{review.username}</span>
              <span className="review-date">{formatDate(review.created_at)}</span>
            </div>
            
            <div className="review-stars" title={`${review.stars} / 5 stars`}>
              {renderStars(review.stars)}
            </div>
            
            <p className="review-text">{review.review_text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewList;