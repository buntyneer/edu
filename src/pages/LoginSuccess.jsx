import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function LoginSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token); // JWT save
      navigate("/dashboard"); // redirect to dashboard
    } else {
      navigate("/login");
    }
  }, [location, navigate]);

  return <p>Logging in...</p>;
}
