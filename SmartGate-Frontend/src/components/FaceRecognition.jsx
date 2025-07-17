import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Camera, UserCheck, Loader2, Users, Settings } from 'lucide-react';

const FaceRecognition = () => {
  const webcamRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [message, setMessage] = useState('');
  const [showWebcam, setShowWebcam] = useState(false);
  const { recognizeUser } = useAuth();
  const navigate = useNavigate();

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;

    setIsCapturing(true);
    setMessage('Analyzing face...');

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const user = await recognizeUser(imageSrc);

        if (user) {
          setMessage(`Welcome, ${user.name}!`);
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          setMessage('Face not recognized. Please try again or use manual login.');
          setTimeout(() => setMessage(''), 3000);
        }
      }
    } catch (error) {
      setMessage('Recognition failed. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsCapturing(false);
    }
  }, [recognizeUser, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
            <UserCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Attendance System</h1>
          <p className="text-blue-200">Secure facial recognition check-in</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          {!showWebcam ? (
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ready to check in?</h2>
              <p className="text-gray-600 mb-6">Position your face in front of the camera for automatic recognition</p>

              <button
                onClick={() => setShowWebcam(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 mb-4"
              >
                Start Face Recognition
              </button>

              <div className="flex space-x-2">
                <button
                  onClick={() => navigate('/login')}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manual Login
                </button>
                <button
                  onClick={() => navigate('/admin')}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Position your face</h2>

              <div className="relative rounded-xl overflow-hidden mb-6">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="w-full"
                  videoConstraints={{
                    width: 300,
                    height: 300,
                    facingMode: "user"
                  }}
                />
                <div className="absolute inset-0 border-4 border-blue-400 rounded-xl pointer-events-none">
                  <div className="absolute top-4 left-4 w-6 h-6 border-l-4 border-t-4 border-blue-400" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-r-4 border-t-4 border-blue-400" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-l-4 border-b-4 border-blue-400" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-r-4 border-b-4 border-blue-400" />
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-lg mb-4 ${
                  message.includes('Welcome')
                    ? 'bg-green-100 text-green-800'
                    : message.includes('failed') || message.includes('not recognized')
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {message}
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={capture}
                  disabled={isCapturing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center"
                >
                  {isCapturing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Capture & Recognize
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowWebcam(false)}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors duration-200"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-blue-200 text-sm">
            Secure • Fast • Contactless
          </p>
        </div>
      </div>
    </div>
  );
};

export default FaceRecognition;
