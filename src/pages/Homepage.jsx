import React from "react";
import { useNavigate } from "react-router-dom";

export default function Homepage() {
  const navigate = useNavigate();

  // ✅ Google Login (Backend redirect)
  const handleGoogleLogin = () => {
    window.location.href =
      "https://edu-backend-2c5z.onrender.com/api/auth/google";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f6f8",
        textAlign: "center",
        padding: "20px",
      }}
    >
      {/* Logo / Title */}
      <h1 style={{ fontSize: "36px", marginBottom: "10px" }}>
        EduManage
      </h1>

      <p style={{ fontSize: "18px", color: "#555", maxWidth: "600px" }}>
        Smart School Management System for multiple schools.
        <br />
        Login required to register your school.
      </p>

      {/* Buttons */}
      <div style={{ marginTop: "30px" }}>
        <button
          onClick={handleGoogleLogin}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            background: "#4285F4",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Login with Google
        </button>
      </div>

      {/* Info */}
      <div style={{ marginTop: "40px", fontSize: "14px", color: "#777" }}>
        <p>
          🔒 School registration is available only after login.
        </p>
        <p>
          New schools will be redirected to registration automatically.
        </p>
      </div>
    </div>
  );
}
