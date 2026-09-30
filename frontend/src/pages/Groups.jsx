import { useAuth } from "../contexts/AuthContext.jsx";
import Header from "../components/Header.jsx";
import { Link } from "react-router-dom";

export default function Groups () {
const { user} = useAuth(); 

//if user is not logged in->this message
  if (!user) {
    return (
      <>
        <Header />
        <div className="groups-page">
          <p>
            You need to <Link to="/login">log in</Link> to see your groups page.
          </p>
        </div>
      </>
    );
  }
  

//working page:
  return (
  <>
    <Header />

    <div className="Groups-page">
      <div className="groups-header">
        <h1>MY GROUPS:</h1>

        <button className="create-group-button">
          CREATE NEW GROUP
        </button>
      </div>

      <div className="my-groups">

      </div>

      <h2>ALL GROUPS:</h2>

      <div className="all-groups">

      </div>
    </div>
  </>
);
}