import { MoviesDashboard } from "@/components/misc/movies-dashboard";
import { loadMoviesLibrary } from "@/lib/misc/movies/data";

export default async function MoviesPage() {
  const data = await loadMoviesLibrary();
  return <MoviesDashboard data={data} />;
}
