"use client";

import { useState, useEffect } from "react";
import axios from "axios";

// --- CONFIG ---
const API_URL = "http://localhost:8000";

export const useRegister = () => {
  const [name, setName] = useState("");
  const [studentCode, setStudentCode] = useState("");

  // State for flow control
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // Display preview
  const [registrationToken, setRegistrationToken] = useState<string | null>(
    null
  );
  const [validationWarning, setValidationWarning] = useState<string | null>(
    null
  );

  const [loading, setLoading] = useState(false);

  // 1. Start Camera (Reset)
  const startCamera = async () => {
    setCapturedImage(null);
    setRegistrationToken(null);
    setValidationWarning(null);
  };

  // Auto-start (Reset) on mount
  useEffect(() => {
    startCamera();
  }, []);

  // 2. Validate Photo (Step 1)
  const validatePhoto = async () => {
    setLoading(true);
    try {
      // A. Capture Frame from Backend
      const captureRes = await axios.get(`${API_URL}/capture_frame`, {
        responseType: "blob",
      });
      const blob = captureRes.data;

      // B. Send for Validation
      const formData = new FormData();
      formData.append("file", blob, "capture.jpg");

      const res = await axios.post(`${API_URL}/register/validate`, formData);
      const data = res.data; // { status, token, message, warning, preview }

      if (data.status === "ok") {
        setRegistrationToken(data.token);
        setCapturedImage(data.preview); // Use the processed face crop from backend

        if (data.warning) {
          setValidationWarning(data.warning);
        }
      }
    } catch (e: any) {
      alert(
        "❌ Validation Failed: " +
          (e.response?.data?.detail || "Make sure camera is running")
      );
      startCamera(); // Reset on failure
    }
    setLoading(false);
  };

  // 3. Reset to retake
  const retake = () => {
    startCamera();
  };

  // 4. Confirm Registration (Step 2)
  const handleConfirm = async () => {
    if (!registrationToken || !name || !studentCode)
      return alert("Please fill details and capture a valid photo.");

    setLoading(true);
    try {
      await axios.post(`${API_URL}/register/confirm`, {
        token: registrationToken,
        name: name,
        student_code: studentCode,
      });

      alert(`✅ Successfully registered ${name}!`);
      // Reset form
      setName("");
      setStudentCode("");
      retake();
    } catch (e: any) {
      alert("❌ Registration Error: " + (e.response?.data?.detail || "Failed"));
    }
    setLoading(false);
  };

  return {
    name,
    setName,
    studentCode,
    setStudentCode,
    capturedImage,
    registrationToken,
    validationWarning,
    loading,
    validatePhoto,
    retake,
    handleConfirm,
    API_URL,
  };
};
