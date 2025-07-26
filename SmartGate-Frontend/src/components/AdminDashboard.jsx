import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Users,
  UserPlus,
  Calendar,
  TrendingUp,
  LogOut,
  Search,
  Edit3,
  Trash2,
  Download,
  Filter,
} from "lucide-react";
import axios from "axios";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  // const [staff, setStaff] = useState([]);
  const [staff, setStaff] = useState({name: '', email: ''});
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [credentials, setCredentials] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showAddStaff, setShowAddStaff] = useState(false);



  useEffect(() => {
    fetchDashboardData();
  }, []);




// fetching data from backend

  const fetchDashboardData = async () => {
    try {
      const [staffResponse, attendanceResponse] = await Promise.all([
        axios.get("/api/users/staff", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        axios.get("/api/attendance/all", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
      ]);

      setStaff(Array.isArray(staffResponse.data) ? staffResponse.data : []);
      setAttendanceData(Array.isArray(attendanceResponse.data) ? attendanceResponse.data : []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setStaff([]);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = Array.isArray(staff)
    ? staff.filter(
        (member) =>
          member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const todayAttendance = Array.isArray(attendanceData)
    ? attendanceData.filter((a) => a.date === selectedDate)
    : [];

  const presentToday = todayAttendance.filter(
    (a) => a.status === "present"
  ).length;
  const totalStaff = filteredStaff.length;

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportAttendance = () => {
    const csvContent = [
      "Name,Date,Check In,Check Out,Working Hours,Status",
      ...attendanceData.map(
        (a) =>
          `${a.userName},${a.date},${a.checkIn ? formatTime(a.checkIn) : ""},${
            a.checkOut ? formatTime(a.checkOut) : ""
          },${a.workingHours || ""},${a.status}`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
      {/* NAVIGATION */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Admin Dashboard
              </h1>
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

      {/* DASHBOARD STATS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            icon={<Users className="h-8 w-8 text-blue-600" />}
            title="Total Staff"
            value={totalStaff}
          />
          <DashboardCard
            icon={<TrendingUp className="h-8 w-8 text-green-600" />}
            title="Present Today"
            value={presentToday}
          />
          <DashboardCard
            icon={<Calendar className="h-8 w-8 text-purple-600" />}
            title="Attendance Rate"
            value={`${
              totalStaff > 0 ? Math.round((presentToday / totalStaff) * 100) : 0
            }%`}
          />
          <DashboardCard
            icon={<UserPlus className="h-8 w-8 text-orange-600" />}
            title="Absent Today"
            value={totalStaff - presentToday}
          />
        </div>

        {/* STAFF MANAGEMENT & ATTENDANCE REPORT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StaffManagement
            filteredStaff={filteredStaff}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showAddStaff={showAddStaff}
            setShowAddStaff={setShowAddStaff}
          />
          <AttendanceReport
            todayAttendance={todayAttendance}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            formatTime={formatTime}
            exportAttendance={exportAttendance}
          />
        </div>

        <RecentActivityTable
          attendanceData={attendanceData}
          formatTime={formatTime}
        />

        {showAddStaff && (
          <AddStaffModal onClose={() => setShowAddStaff(false)} />
        )}

      </div>
    </div>
  );
};

const DashboardCard = ({ icon, title, value }) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="flex items-center">
      <div className="flex-shrink-0">{icon}</div>
      <div className="ml-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

const StaffManagement = ({
  filteredStaff,
  searchTerm,
  setSearchTerm,
  setShowAddStaff,
}) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-900">Staff Management</h3>
      <button
        onClick={() => setShowAddStaff(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Add Staff
      </button>
    </div>
    <div className="mb-4 relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        placeholder="Search staff..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {filteredStaff.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div>
            <h4 className="font-medium text-gray-900">{member.name}</h4>
            <p className="text-sm text-gray-600">{member.email}</p>
            <p className="text-xs text-gray-500">{member.department}</p>
          </div>
          <div className="flex space-x-2">
            <button className="p-1 text-gray-600 hover:text-blue-600">
              <Edit3 className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-600 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AttendanceReport = ({
  todayAttendance,
  selectedDate,
  setSelectedDate,
  formatTime,
  exportAttendance,
}) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-900">Attendance Reports</h3>
      <button
        onClick={exportAttendance}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </button>
    </div>
    <div className="mb-4 flex items-center space-x-2">
      <Filter className="w-4 h-4 text-gray-400" />
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {todayAttendance.map((attendance) => (
        <div
          key={attendance.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div>
            <h4 className="font-medium text-gray-900">{attendance.userName}</h4>
            <p className="text-sm text-gray-600">
              {attendance.checkIn
                ? `In: ${formatTime(attendance.checkIn)}`
                : "Not checked in"}
            </p>
            {attendance.checkOut && (
              <p className="text-sm text-gray-600">
                Out: {formatTime(attendance.checkOut)}
              </p>
            )}
          </div>
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              attendance.status === "present"
                ? "bg-green-100 text-green-800"
                : attendance.status === "partial"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {attendance.status}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const RecentActivityTable = ({ attendanceData, formatTime }) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">
      Recent Activity
    </h3>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Staff Member
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Check In
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Check Out
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Working Hours
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {attendanceData.slice(0, 20).map((attendance) => (
            <tr key={attendance.id}>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {attendance.userName}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {new Date(attendance.date).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {attendance.checkIn ? formatTime(attendance.checkIn) : "-"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {attendance.checkOut ? formatTime(attendance.checkOut) : "-"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {attendance.workingHours || "-"}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    attendance.status === "present"
                      ? "bg-green-100 text-green-800"
                      : attendance.status === "partial"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {attendance.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// model start

const AddStaffModal = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [credentials, setCredentials] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    position: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "/api/users/staff",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.success) {
        setMessage("Staff added successfully!");
        setCredentials(res.data.credentials);
        setForm({ name: "", email: "", department: "", position: "" });
      } else {
        setMessage(res.data.message || "Failed to add staff.");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Server error.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 w-96 shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Add New Staff Member</h3>

        <div className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            name="department"
            placeholder="Department"
            value={form.department}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            name="position"
            placeholder="Position"
            value={form.position}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {message && (
          <p className={`mt-4 text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}

        {credentials && (
          <div className="mt-4 p-2 bg-gray-100 rounded">
            <strong>Assigned Credentials:</strong>
            <pre className="text-sm">{JSON.stringify(credentials, null, 2)}</pre>
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 text-white rounded-lg ${
              loading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Adding..." : "Add Staff"}
          </button>
        </div>
      </div>
    </div>
  );
};


// end of model

export default AdminDashboard;