// components/layout/AppLayout.jsx
import Sidebar from "./Sidebar";
import Header from "./Header";
import MainContent from "./MainContent";

export default function AppLayout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* سایدبار ثابت در سمت چپ */}
      <Sidebar />

      {/* سمت راست: هدر + محتوا */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Header />
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}
