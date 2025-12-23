import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./Components/ProtectedRoutes/ProtectedRoutes";
import {
  ViewDashboard,
  ViewControlDashboard,
  ViewLogin,
  ViewResetPassword,
} from "./Views/index";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ViewDashboard />} />
      <Route path="/ViewLogin" element={<ViewLogin />} />
      <Route path="/ResetPassword" element={<ViewResetPassword />} />
      <Route
        path="/ControlDashboard"
        element={
          <ProtectedRoute>
            <ViewControlDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
