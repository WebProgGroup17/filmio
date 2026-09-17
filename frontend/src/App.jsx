import { BrowserRouter, Routes, Route } from "react-router-dom";
import NowInCinemas from "./pages/NowInCinemas";
import SearchResults from "./pages/SearchResults";
import OneMovieData from "./pages/OneMovieData";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import "./App.css";

function App() {
   return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NowInCinemas />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/movies/:id" element={<OneMovieData />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;