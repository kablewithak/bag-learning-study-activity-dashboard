import { Navigate, Route, Routes } from "react-router-dom";

import { GroupDashboardPage } from "./pages/GroupDashboardPage";

const seededGroupId = "4a4d6d1e-bf59-4e09-8fa7-21b2d2fcb9f9";

export default function App() {
  return (
    <Routes>
      <Route path="/groups/:groupId" element={<GroupDashboardPage />} />
      <Route path="*" element={<Navigate replace to={`/groups/${seededGroupId}`} />} />
    </Routes>
  );
}
