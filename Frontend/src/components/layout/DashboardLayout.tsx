import { Outlet } from "react-router-dom";
import CommandBar from "./CommandBar";

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#050810] text-white">
      <CommandBar />

      <div className="mx-auto max-w-[1600px]">
        <Outlet />
      </div>
    </div>
  );
}

export default DashboardLayout;