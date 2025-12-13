import React, { useState } from "react";
import { API_BASE_URL } from "../config";

interface Props {
  onLogin: (token: string) => void;
}

const AuthForm: React.FC<Props> = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";

    try {
      // Use the centralized configuration URL
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // 1. Try to parse response as JSON
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        // Fallback for plain text errors
        const text = await res.text();
        data = { message: text };
      }

      // 2. Handle Errors
      if (!res.ok) {
        console.error("Error response data:", data);
        // Prefer the server's message, otherwise map common status codes
        if (data.message) throw new Error(data.message);
        if (res.status === 401) throw new Error("Incorrect email or password.");
        if (res.status === 404) throw new Error("Account not found.");
        throw new Error("Authentication failed.");
      }

      // 3. Success
      localStorage.setItem("token", data.token);
      onLogin(data.token);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong.");
      }
    }
  };

  return (
    <div
      className="thought-form"
      style={{ maxWidth: "400px", margin: "2rem auto" }}
    >
      <h2>{isSignup ? "Sign Up" : "Login"}</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <input
          className="thought-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="thought-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="submit-btn" type="submit">
          {isSignup ? "Sign Up" : "Login"}
        </button>
        {error && <p style={{ color: "var(--primary-color)" }}>{error}</p>}
        <p
          style={{ textAlign: "center", cursor: "pointer", fontSize: "0.9rem" }}
          onClick={() => setIsSignup(!isSignup)}
        >
          {isSignup
            ? "Already have an account? Login"
            : "Need an account? Sign Up"}
        </p>
      </form>
    </div>
  );
};
export default AuthForm;
