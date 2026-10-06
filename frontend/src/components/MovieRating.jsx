export default function StarRating({ rating, count }) {
  //numbers should be integers, not decimals
  const roundedNumber = Math.round(rating);

  return (
    <div className="movie-rating">
      <span className={roundedNumber >= 1 ? "star filled" : "star"}>★</span>
      <span className={roundedNumber >= 2 ? "star filled" : "star"}>★</span>
      <span className={roundedNumber >= 3 ? "star filled" : "star"}>★</span>
      <span className={roundedNumber >= 4 ? "star filled" : "star"}>★</span>
      <span className={roundedNumber >= 5 ? "star filled" : "star"}>★</span>
    </div>
  );
}