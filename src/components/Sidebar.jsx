const Sidebar = () => {
  return (
    <aside className="sidebar">

      <div className="logo">
        <div className="logo-icon">AI</div>
        <div>
          <h4>AI Detector</h4>
          <span>Image Analysis</span>
        </div>
      </div>

      <nav className="sidebar-menu">

        <a href="#" className="menu-item active">
          <span>⌂</span>
          Dashboard
        </a>

        <a href="#" className="menu-item">
          <span>⌕</span>
          Detect Image
        </a>

        <a href="#" className="menu-item">
          <span>◷</span>
          History
        </a>

        <a href="#" className="menu-item">
          <span>▥</span>
          Statistics
        </a>

      </nav>

      <div className="sidebar-bottom">
        <a href="#" className="menu-item">
          <span>⚙</span>
          Settings
        </a>
      </div>

    </aside>
  );
};

export default Sidebar;