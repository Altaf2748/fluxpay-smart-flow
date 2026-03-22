import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function EKYCEnroll() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/biometric-setup", { replace: true }); }, []);
  return null;
}