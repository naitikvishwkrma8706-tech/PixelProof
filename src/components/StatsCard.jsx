const StatsCard = ({ title, value, icon }) => {
  return (
    <div className="stats-card">

      <div className="stats-icon">
        {icon}
      </div>

      <div>
        <p>{title}</p>
        <h3>{value}</h3>
      </div>

    </div>
  );
};

export default StatsCard;