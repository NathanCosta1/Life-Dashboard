import Link from "next/link";
import type { MovieReview, MoviesLibrary } from "@/lib/misc/movies/types";

function formatRating(value: number | null) {
  return value === null ? "—" : `${value.toFixed(value % 1 === 0 ? 0 : 1)}/10`;
}

function displayDate(review: MovieReview) {
  return review.watchedDateLabel ?? "No source date";
}

export function MoviesDashboard({ data }: { data: MoviesLibrary }) {
  const { summary, reviews, watchlist } = data;
  const rankingReviews = reviews
    .filter((review) => review.rating !== null)
    .sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  const ratingReviews = reviews.filter((review) => review.rating !== null);
  const maxRatingCount = Math.max(1, ...Array.from({ length: 10 }, (_, index) =>
    ratingReviews.filter((review) => review.rating === index + 1).length,
  ));

  return (
    <main className="movies-page">
      <div className="movies-marquee">
        <Link href="/misc" className="movies-back"><span aria-hidden="true">←</span> MISC</Link>
        <div className="movies-bulbs" aria-hidden="true">{Array.from({ length: 22 }, (_, index) => <i key={index} />)}</div>
        <header className="movies-header">
          <p>Picture house / personal record</p>
          <h1>Movies</h1>
          <span>{String(summary.reviewCount).padStart(2, "0")} features reviewed</span>
        </header>
      </div>

      <section className="movies-feature-screen" aria-label="Featured movie statistics">
        <div className="movies-screen-grid" aria-hidden="true" />
        <article className="movies-feature-primary">
          <p>Now showing</p>
          <strong>{summary.highestRatedReview?.title ?? "No rated feature"}</strong>
          <span>{summary.highestRatedReview ? `${formatRating(summary.highestRatedReview.rating)} source rating` : "Waiting for a review"}</span>
        </article>
        <div className="movies-ticket-stats">
          <article><span>Total admissions</span><strong>{summary.reviewCount}</strong></article>
          <article><span>Average rating</span><strong>{formatRating(summary.averageRating)}</strong></article>
          <article><span>Median rating</span><strong>{formatRating(summary.medianRating)}</strong></article>
          <article><span>Reviews with notes</span><strong>{summary.notesCount}</strong></article>
        </div>
      </section>

      {summary.yearlySummaries.length > 0 && (
        <section className="movies-year-strip" aria-label="Movie attendance by year">
          <header><p>Annual attendance</p><span>Source-derived yearly totals</span></header>
          <div>
            {summary.yearlySummaries.map((year) => (
              <article key={year.year}>
                <time>{year.year}</time>
                <div className="movies-year-bar" aria-hidden="true">
                  <span style={{ height: `${Math.min(100, 24 + year.reviewCount * 18)}%` }} />
                </div>
                <strong>{year.reviewCount}</strong>
                <small>{year.averageRating === null ? "No rating" : `${formatRating(year.averageRating)} avg`}</small>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="movies-columns">
        <section className="movies-rating-board" aria-label="Rating distribution">
          <header><p>Rating board</p><span>1–10 distribution</span></header>
          {ratingReviews.length === 0 ? (
            <div className="movies-empty">No rated features in the source.</div>
          ) : (
            <div className="movies-rating-bars">
              {Array.from({ length: 10 }, (_, index) => {
                const rating = index + 1;
                const count = ratingReviews.filter((review) => review.rating === rating).length;
                return (
                  <article key={rating}>
                    <span>{rating}</span>
                    <div><i style={{ width: `${count / maxRatingCount * 100}%` }} /></div>
                    <strong>{count}</strong>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="movies-ranking" aria-label="Highest rated movie ranking">
          <header><p>Top billing</p><span>Highest to lowest</span></header>
          {rankingReviews.length === 0 ? (
            <div className="movies-empty">No ratings available.</div>
          ) : rankingReviews.slice(0, 8).map((review, index) => (
            <article key={review.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{review.title}</strong><small>{displayDate(review)}</small></div>
              <b>{formatRating(review.rating)}</b>
            </article>
          ))}
        </section>
      </div>

      <section className="movies-review-ledger" aria-label="Movie review ledger">
        <header><p>Review ledger</p><span>{reviews.length} source records</span></header>
        {reviews.length === 0 ? (
          <div className="movies-empty movies-empty-wide">The theater is dark. No reviewed movies are in the source.</div>
        ) : reviews.slice().reverse().map((review) => (
          <article key={review.id}>
            <div className="movies-review-title">
              <strong>{review.title}</strong>
              <small>{review.location ?? "Location not recorded"}</small>
            </div>
            <time>{displayDate(review)}</time>
            <span className="movies-review-rating">{formatRating(review.rating)}</span>
            <div className="movies-review-copy">
              <small>{review.companionText ? `With ${review.companionText}` : "Companions not recorded"}</small>
              {review.notes && <p>{review.notes}</p>}
            </div>
          </article>
        ))}
      </section>

      <section className="movies-watchlist" aria-label="Movies to watch">
        <header><p>Coming attractions</p><span>{watchlist.length} on the watchlist</span></header>
        {watchlist.length === 0 ? (
          <div className="movies-empty">No watchlist titles found.</div>
        ) : (
          <div className="movies-watchlist-grid">
            {watchlist.map((item) => (
              <article key={item.id}>
                <div><span>Next feature</span>{item.interestedByMaddy === true && <i>Maddy: interested</i>}</div>
                <h2>{item.title}</h2>
                {item.description && <p>{item.description}</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      {(summary.companionCounts.length > 0 || summary.locationCounts.length > 0) && (
        <section className="movies-audience-ledger">
          {summary.companionCounts.length > 0 && (
            <article><header><p>Audience</p></header>{summary.companionCounts.map((item) => (
              <div key={item.name}><span>{item.name}</span><strong>{item.count}</strong></div>
            ))}</article>
          )}
          {summary.locationCounts.length > 0 && (
            <article><header><p>Locations</p></header>{summary.locationCounts.map((item) => (
              <div key={item.name}><span>{item.name}</span><strong>{item.count}</strong></div>
            ))}</article>
          )}
        </section>
      )}

      {data.issues.length > 0 && (
        <details className="movies-source-issues">
          <summary>Source notes ({data.issues.length})</summary>
          <ul>{data.issues.map((issue, index) => <li key={`${issue.rowNumber}-${issue.field}-${index}`}><strong>{issue.tab} · row {issue.rowNumber} · {issue.field}</strong> {issue.message}</li>)}</ul>
        </details>
      )}
    </main>
  );
}
