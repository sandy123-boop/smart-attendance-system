import { Routes, Route, Navigate } from 'react-router-dom';
import TeacherClasses from './teacher/Classes.jsx';
import ClassDetail from './teacher/ClassDetail.jsx';
import LiveSession from './teacher/LiveSession.jsx';
import Reports from './teacher/Reports.jsx';

export default function TeacherDashboard() {
  return (
    <Routes>
      <Route index element={<Navigate to="classes" replace />} />
      <Route path="classes" element={<TeacherClasses />} />
      <Route path="classes/:id" element={<ClassDetail />} />
      <Route path="classes/:id/reports" element={<Reports />} />
      <Route path="sessions/:id" element={<LiveSession />} />
      <Route path="*" element={<Navigate to="classes" replace />} />
    </Routes>
  );
}
