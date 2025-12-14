export const getApiUrl = () => {
  if (typeof window === "undefined") return "http://localhost:8000"; // Server-side fallback
  
  // Dynamically determine the API URL based on the current hostname
  // This allows the frontend to talk to the backend on the same machine (LAN IP)
  const hostname = window.location.hostname;
  return `http://${hostname}:8000`;
};

export const API_BASE_URL = getApiUrl();
