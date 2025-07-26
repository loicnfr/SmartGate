import React, { useState } from "react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const FaceRegister = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const webcamRef = React.useRef(null);
  const { registerUserWithFace } = useAuth();
  const navigate = useNavigate();

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  };

  const handleRegister = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    if (!email || !name || !capturedImage) {
      setError("All fields and face capture are required.");
      setLoading(false);
      return;
    }

    const formData = { email, name };

    const result = await registerUserWithFace(formData, capturedImage);
    if (result.success) {
      setSuccess("Face registered! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      setError(result.message || "Registration failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold">Register with Face</h2>

        <input
          className="w-full p-2 rounded bg-gray-700"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full p-2 rounded bg-gray-700"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="rounded w-full"
        />
        <button
          className="bg-blue-600 hover:bg-blue-700 w-full py-2 rounded"
          onClick={capture}
        >
          Capture Face
        </button>

        {capturedImage && (
          <img src={capturedImage} alt="Captured" className="rounded w-full" />
        )}

        <button
          onClick={handleRegister}
          className="w-full bg-green-600 hover:bg-green-700 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Registering..." : "Submit & Register Face"}
        </button>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">{success}</p>}
      </div>
    </div>
  );
};

export default FaceRegister;
