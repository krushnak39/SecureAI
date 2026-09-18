import { Outlet } from "react-router-dom";

import CommandBar from "./CommandBar";
import Sidebar from "./Sidebar";

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#050810] text-white">
      <Sidebar />

      <div className="min-h-screen lg:pl-64">
        <CommandBar />

        <main className="min-h-[calc(100vh-4rem)]">
          <div className="mx-auto max-w-[1700px] px-5 py-6 lg:px-7">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;