const UploadBox = () => {
  return (
    <div className="upload-card">

      <div className="section-title">
        <div>
          <h3>Detect an Image</h3>
          <p>Upload an image to check whether it is real or AI-generated.</p>
        </div>
      </div>

      <div className="upload-box">

        <div className="upload-icon">
          ↑
        </div>

        <h4>Upload your image</h4>

        <p>
          Drag & drop your image here or click to browse
        </p>

        <button className="browse-btn">
          Browse Image
        </button>

        <small>
          Supported formats: JPG, JPEG, PNG
        </small>

      </div>

    </div>
  );
};

export default UploadBox;