import React from "react";

export default function Homepage() {
  // ✅ Google Login Logic (Directs to your Render Backend)
  const handleGoogleLogin = () => {
    // Jab user is par click karega, wo Render ke auth process par jayega
    window.location.href = "edu-backend-2c5z.onrender.com";
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.logo}>EduManage</h1>
        <h2 style={styles.title}>Smart School Management System</h2>
        <p style={styles.description}>
          Manage your students, attendance, and staff in one place. 
          Please login to access your dashboard or register a new school.
        </p>

        <div style={styles.buttonSection}>
          <button onClick={handleGoogleLogin} style={styles.loginBtn}>
            <img 
              src="www.gstatic.com" 
              alt="Google Icon" 
              style={styles.icon} 
            />
            Continue with Google
          </button>
        </div>

        <div style={styles.footerInfo}>
          <p>🔒 Secure Login via Google</p>
          <p style={{ marginTop: "5px" }}>
            New schools will be redirected to the registration form after login.
          </p>
        </div>
      </div>
    </div>
  );
}

// Inline Styles taaki CSS ki extra file na banani pade
const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    padding: "20px",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "40px",
    borderRadius: "15px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    maxWidth: "500px",
    width: "100%",
    textAlign: "center",
  },
  logo: {
    fontSize: "42px",
    fontWeight: "800",
    color: "#2d3436",
    marginBottom: "10px",
    letterSpacing: "-1px",
  },
  title: {
    fontSize: "20px",
    color: "#636e72",
    marginBottom: "20px",
  },
  description: {
    fontSize: "16px",
    color: "#b2bec3",
    lineHeight: "1.6",
    marginBottom: "30px",
  },
  buttonSection: {
    marginBottom: "30px",
  },
  loginBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    width: "100%",
    padding: "14px",
    fontSize: "16px",
    fontWeight: "600",
    backgroundColor: "#ffffff",
    color: "#2d3436",
    border: "1px solid #dfe6e9",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  icon: {
    width: "20px",
    height: "20px",
  },
  footerInfo: {
    fontSize: "13px",
    color: "#636e72",
    borderTop: "1px solid #eee",
    paddingTop: "20px",
  },
};
