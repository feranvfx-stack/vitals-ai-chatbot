import { useState } from "react";
import Header from "./components/Header";
import ChatPanel from "./components/ChatPanel";
import CareMap from "./components/CareMap";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="app">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <ChatPanel hidden={activeTab !== "chat"} />
      <CareMap hidden={activeTab !== "care"} />
    </div>
  );
}
