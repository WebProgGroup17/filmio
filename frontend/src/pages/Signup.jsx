import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../api/auth.js";
import Header from "../components/Header";

function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await signup({ email, password });

      navigate("/login");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <>
      <Header />
      <div className="singup-page">
        <h1>Sign Up</h1>

      <form onSubmit={handleSignup}>
      
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error && <p>{error}</p>}

          <button type="submit">
            Sign Up
          </button>
        </form>

        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </>
  );
}

export default Signup;
