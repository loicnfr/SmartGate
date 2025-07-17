import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Clock, Calendar, TrendingUp, LogOut, Camera } from 'lucide-react';
import axios from 'axios';

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      const response = await axios.get(`/api/attendance/user/${user?.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAttendanceData(response.data.attendance || []);
      setTodayAttendance(response.data.todayAttendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceData([]); // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInOut = () => {
    window.location.href = '/face-recognition';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWorkingHours = (attendance) => {
    if (attendance.checkIn && attendance.checkOut) {
      const checkIn = new Date(attendance.checkIn);
      const checkOut = new Date(attendance.checkOut);
      const diff = checkOut.getTime() - checkIn.getTime();
      return (diff / (1000 * 60 * 60)).toFixed(1);
    }
    return 'In Progress';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Staff Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Today's Status</h3>
                <p className="text-sm text-gray-600">
                  {todayAttendance?.checkIn ? 'Checked In' : 'Not Checked In'}
                </p>
              </div>
            </div>
            {todayAttendance?.checkIn && (
              <div className="mt-4 text-sm text-gray-700">
                <p>Check-in: {formatTime(todayAttendance.checkIn)}</p>
                {todayAttendance.checkOut && (
                  <p>Check-out: {formatTime(todayAttendance.checkOut)}</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">This Month</h3>
                <p className="text-2xl font-bold text-green-600">
                  {(attendanceData || []).filter(a => a.status === 'present').length}
                </p>
                <p className="text-sm text-gray-600">Days Present</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Average Hours</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {(attendanceData || []).filter(a => a.workingHours).length > 0
                    ? (
                        (attendanceData || [])
                          .filter(a => a.workingHours)
                          .reduce((sum, a) => sum + (a.workingHours || 0), 0) /
                        (attendanceData || []).filter(a => a.workingHours).length
                      ).toFixed(1)
                    : '0.0'}
                </p>
                <p className="text-sm text-gray-600">Hours/Day</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions + Personal Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <button
              onClick={handleCheckInOut}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              <Camera className="w-5 h-5 mr-2" />
              {todayAttendance?.checkIn && !todayAttendance?.checkOut
                ? 'Check Out with Face Recognition'
                : 'Check In with Face Recognition'}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-gray-900">{user?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Department</label>
                <p className="text-gray-900">{user?.department || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Position</label>
                <p className="text-gray-900">{user?.position || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Attendance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Check In', 'Check Out', 'Working Hours', 'Status'].map(header => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(attendanceData || []).slice(0, 10).map((attendance) => (
                  <tr key={attendance.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(attendance.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendance.checkIn ? formatTime(attendance.checkIn) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendance.checkOut ? formatTime(attendance.checkOut) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getWorkingHours(attendance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        attendance.status === 'present'
                          ? 'bg-green-100 text-green-800'
                          : attendance.status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {attendance.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
