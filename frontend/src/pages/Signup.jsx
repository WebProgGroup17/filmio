import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../api/auth.js";

const passwordRequirements = [
  { label: "Min. 8 characters", test: (value) => value.length >= 8 },
  { label: "1 uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { label: "1 number", test: (value) => /[0-9]/.test(value) },
];

function Signup() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);

  const isPasswordValid = passwordRequirements.every((requirement) =>
    requirement.test(password)
  );

  const handleSignup = async (event) => {
    event.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Password does not meet all requirements.");
      return;
    }

    try {
      await signup({ username, email, password });

      navigate("/login");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      <h1>Sign Up</h1>

      <form onSubmit={handleSignup}>
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </div>

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
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            required
          />

          {(passwordFocused || password.length > 0) && (
            <ul className="password-requirements">
              {passwordRequirements.map((requirement) => {
                const met = requirement.test(password);
                return (
                  <li
                    key={requirement.label}
                    className={
                      met
                        ? "password-requirement password-requirement--met"
                        : "password-requirement"
                    }
                  >
                    <span className="password-requirement-icon">
                      {met ? "✓" : "○"}
                    </span>
                    {requirement.label}
                  </li>
                );
              })}
            </ul>
          )}
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
  );
}

export default Signup;
