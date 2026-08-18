export default function Header({ activeTab, onTabChange }) {
  return (
    <header className="header">
      <div className="brand">
        <svg
          className="pulse"
          viewBox="0 0 120 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M0 14H32L38 4L46 24L54 14H120"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <span className="wordmark">Vitals</span>
      </div>
      <nav className="tabs" role="tablist">
        <button
          className={`tab ${activeTab === "chat" ? "active" : ""}`}
          data-tab="chat"
          role="tab"
          aria-selected={activeTab === "chat"}
          onClick={() => onTabChange("chat")}
        >
          Chat
        </button>
        <button
          className={`tab ${activeTab === "care" ? "active" : ""}`}
          data-tab="care"
          role="tab"
          aria-selected={activeTab === "care"}
          onClick={() => onTabChange("care")}
        >
          Care Map
        </button>
      </nav>
    </header>
  );
}
