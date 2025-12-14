"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Log, ApiResponse } from "../types";

// --- CONFIG ---
const API_URL = "http://localhost:8000";

export const useDashboard = () => {
  // State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [topic, setTopic] = useState("");
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);

  // Manual Override State
  const [manualName, setManualName] = useState("");
  const [manualStatus, setManualStatus] = useState("PRESENT");

  // --- POLLING (The Heartbeat) ---
  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const res = await axios.get<ApiResponse>(`${API_URL}/attendance/live`);
        if (res.data.status === "active") {
          setIsSessionActive(true);
          setLogs(res.data.logs);
        } else {
          setIsSessionActive(false);
          setLogs([]);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    // Run immediately then every 2 seconds
    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 2000);
    return () => clearInterval(interval);
  }, []);

  // --- ACTIONS ---

  const handleStartClass = async (subjectCode?: string) => {
    if (!topic) return alert("Please enter a class topic!");
    setLoading(true);
    try {
      await axios.post(`${API_URL}/start_class`, { 
        topic,
        subject_code: subjectCode || null 
      });
      setIsSessionActive(true);
    } catch (e) {
      alert("Failed to start class");
    }
    setLoading(false);
  };

  const handleEndClass = async () => {
    if (!confirm("Are you sure you want to end this class?")) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/end_class`);
      setIsSessionActive(false);
      setLogs([]);
      setTopic("");
    } catch (e) {
      alert("Failed to end class");
    }
    setLoading(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName) return;

    try {
      await axios.post(`${API_URL}/attendance/manual`, {
        student_name: manualName,
        status: manualStatus,
      });
      alert(`Manually added ${manualName}`);
      setManualName(""); // Clear input
    } catch (error: any) {
      alert(
        "Error: " +
          (error.response?.data?.detail || "Student not found or system error")
      );
    }
  };

  return {
    isSessionActive,
    topic,
    setTopic,
    logs,
    loading,
    manualName,
    setManualName,
    manualStatus,
    setManualStatus,
    handleStartClass,
    handleEndClass,
    handleManualSubmit,
    API_URL,
  };
};
