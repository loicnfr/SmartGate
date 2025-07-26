import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useLocalStorage } from "../src/hooks/useLocalStorage";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

const API_BASE_URL = "http://localhost:8001/api"; // Your Node.js backend
const FLASK_API_URL = "http://localhost:5000"; // Your Flask face recognition backend

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useLocalStorage("user", null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      validateToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/validate`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });
      console.log("Login response:", response.data);
      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        setUser(response.data.user);

        return true;
      }

      return false;
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // Register user and encode face
  const registerUserWithFace = async (formData, imageData) => {
    try {
      // 1. Register user in Node.js backend
      const userRes = await axios.post(
        `${API_BASE_URL}/auth/register`,
        formData
      );

      if (!userRes.data.success || !userRes.data.user) {
        throw new Error("User registration failed");
      }

      const userId = userRes.data.user._id;

      // 2. Send face image to Flask backend for encoding
      // imageData is expected as full base64 string: "data:image/jpeg;base64,...."
      const base64Image = imageData.split(",")[1]; // Remove prefix

      const flaskRes = await axios.post(`${FLASK_API_URL}/encode`, {
        image: base64Image,
        userId,
      });

      if (!flaskRes.data.success) {
        throw new Error("Face encoding failed");
      }

      return { success: true };
    } catch (error) {
      console.error("Face registration error:", error);
      return { success: false, message: error.message };
    }
  };

  // Login using face recognition
  const recognizeUser = async (imageData) => {
    try {
      const base64Image = imageData.split(",")[1]; // Remove prefix

      const flaskRes = await axios.post(`${FLASK_API_URL}/recognize`, {
        image: base64Image,
      });

      if (flaskRes.data.success && flaskRes.data.userId) {
        // Fetch user details from Node.js backend
        const userRes = await axios.get(
          `${API_BASE_URL}/users/${flaskRes.data.userId}`
        );

        const user = userRes.data;
        // Optionally get token from Flask backend or generate one here if applicable
        // For now, we assume token is handled elsewhere or omitted in face login

        setUser(user);
        return user;
      }

      return null;
    } catch (error) {
      console.error("Face recognition error:", error);
      return null;
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    registerUserWithFace,
    recognizeUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
