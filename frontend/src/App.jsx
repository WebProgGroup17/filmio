import { BrowserRouter, Routes, Route } from "react-router-dom";
import NowInCinemas from "./pages/nowincinemas/NowInCinemas";
import SearchResults from "./pages/searchresults/SearchResults";
import OneMovieData from "./pages/onemoviepage/OneMovieData";
import Login from "./pages/login/Login";
import Signup from "./pages/signup/Signup";
import MyAccount from "./pages/myaccount/MyAccount";
import MyFavourites from "./pages/myfavourites/MyFavourites";
import Groups from "./pages/groups/Groups";
import SharedFavourites from "./pages/sharedfavourites/SharedFavourites";
import OneGroup from "./pages/onegrouppage/OneGroup";
import Footer from "./components/footer/Footer";

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Routes>
          <Route path="/" element={<NowInCinemas />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/movies/:id" element={<OneMovieData />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/account" element={<MyAccount />} />
          <Route path="/favourites" element={<MyFavourites />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:groupId" element={<OneGroup />} />
          <Route path="/shared-favourites/:shareToken" element={<SharedFavourites />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;