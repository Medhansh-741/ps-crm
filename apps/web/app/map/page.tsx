"use client";

import dynamic from "next/dynamic";
import LandNavbar from "@/components/LandNavbar";
import ChatWidget from "@/components/ChatWidget";
import Footer from "@/components/Footer";
import { useTheme } from "@/components/ThemeProvider";

const MapComponent = dynamic(
  () => import("@/components/MapComponent"),
  { ssr: false }
);

export default function Home() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      <LandNavbar />

      <div className="flex-1">
        <MapComponent />
      </div>

      <ChatWidget />
      <Footer />
    </div>
  );
}