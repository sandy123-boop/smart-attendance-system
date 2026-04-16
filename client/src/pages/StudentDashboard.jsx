import { Routes, Route, Navigate } from 'react-router-dom';
import StudentClasses from './student/Classes.jsx';
import StudentClassDetail from './student/ClassDetail.jsx';
import Scan from './student/Scan.jsx';
import StudentAttendance from './student/Attendance.jsx';
import AttendanceDetail from './student/AttendanceDetail.jsx';

export default function StudentDashboard() {
  return (
    <Routes>
      <Route index element={<Navigate to="classes" replace />} />
      <Route path="classes" element={<StudentClasses />} />
      <Route path="classes/:id" element={<StudentClassDetail />} />
      <Route path="scan" element={<Scan />} />
      <Route path="attendance" element={<StudentAttendance />} />
      <Route path="attendance/:classId" element={<AttendanceDetail />} />
      <Route path="*" element={<Navigate to="classes" replace />} />
    </Routes>
  );
}
