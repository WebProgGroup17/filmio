import { BrowserRouter, Routes, Route } from "react-router-dom";
import NowInCinemas from "./pages/NowInCinemas";
import SearchResults from "./pages/SearchResults";
import "./App.css";

function App() {
   return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NowInCinemas />} />
        <Route path="/search" element={<SearchResults />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;