const RecentDetections = () => {

  const detections = [
    {
      name: "image_01.jpg",
      result: "AI Generated",
      confidence: "91%",
    },
    {
      name: "nature_photo.jpg",
      result: "Real Image",
      confidence: "87%",
    },
    {
      name: "portrait.png",
      result: "AI Generated",
      confidence: "94%",
    },
  ];

  return (
    <div className="recent-card">

      <div className="section-title">
        <div>
          <h3>Recent Detections</h3>
          <p>Your latest image analysis results.</p>
        </div>

        <button className="view-btn">
          View All
        </button>
      </div>

      <div className="detection-list">

        {detections.map((item, index) => (

          <div className="detection-item" key={index}>

            <div className="image-placeholder">
              IMG
            </div>

            <div className="image-info">
              <strong>{item.name}</strong>
              <span>Recently analyzed</span>
            </div>

            <div
              className={
                item.result === "AI Generated"
                  ? "result ai-result"
                  : "result real-result"
              }
            >
              {item.result}
            </div>

            <div className="confidence">
              {item.confidence}
            </div>

          </div>

        ))}

      </div>

    </div>
  );
};

export default RecentDetections;