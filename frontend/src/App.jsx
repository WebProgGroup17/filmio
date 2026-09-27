import { BrowserRouter, Routes, Route } from "react-router-dom";
import NowInCinemas from "./pages/NowInCinemas";
import SearchResults from "./pages/SearchResults";
import OneMovieData from "./pages/OneMovieData";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MyAccount from "./pages/MyAccount";
import MyFavourites from "./pages/MyFavourites";
import SharedFavourites from "./pages/SharedFavourites";
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
        <Route path="/account" element={<MyAccount />} />
        <Route path="/favourites" element={<MyFavourites />} />
        <Route path="/shared-favourites/:shareToken" element={<SharedFavourites />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;