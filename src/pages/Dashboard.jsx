import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
const Dashboard = () => {
  const fileInputRef = useRef(null);
  const resultRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [detectionHistory, setDetectionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("pixelproof-theme") === "dark";
  });
  const [successMessage, setSuccessMessage] = useState(
    () => sessionStorage.getItem("pixelproof-login-message") || "",
  );
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!sessionStorage.getItem("pixelproof-token"),
  );

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("pixelproof-user")) || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("pixelproof-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = sessionStorage.getItem("pixelproof-token");

      if (!token) {
        setDetectionHistory([]);
        return;
      }

      try {
        setHistoryLoading(true);
        setHistoryError("");

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/history`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch history");
        }

        setDetectionHistory(data.history || []);
      } catch (error) {
        console.error("History Fetch Error:", error);
        setHistoryError(error.message);
      } finally {
        setHistoryLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchHistory();
    } else {
      setDetectionHistory([]);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage("");
      sessionStorage.removeItem("pixelproof-login-message");
    }, 3000);

    return () => clearTimeout(timer);
  }, [successMessage]);
  useEffect(() => {
    const handlePaste = (event) => {
      const items = event.clipboardData?.items;

      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();

          if (file && file.type) {
            const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

            if (!allowedTypes.includes(file.type)) {
              setErrorMessage("Paste a JPG, PNG, or WEBP image.");
              return;
            }

            if (file.size > 10 * 1024 * 1024) {
              setErrorMessage("Image size must be less than 10 MB.");
              return;
            }

            setSelectedImage((previousImage) => {
              if (previousImage?.startsWith("blob:")) {
                URL.revokeObjectURL(previousImage);
              }

              return URL.createObjectURL(file);
            });

            setSelectedFile(file);
            setFileName(file.name || "Pasted image");
            setImageUrl("");
            setErrorMessage("");
            return;
          }
        }
      }
    };

    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, []);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Please select a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Image size must be less than 10 MB.");
      event.target.value = "";
      return;
    }

    if (selectedImage?.startsWith("blob:")) {
      URL.revokeObjectURL(selectedImage);
    }

    setSelectedImage(URL.createObjectURL(file));
    setSelectedFile(file);
    setFileName(file.name);
    setErrorMessage("");
    setImageUrl("");
  };

  const handleRemoveImage = () => {
    if (selectedImage?.startsWith("blob:")) {
      URL.revokeObjectURL(selectedImage);
    }

    setSelectedImage(null);
    setSelectedFile(null);
    setFileName("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLoadImageUrl = () => {
    const url = imageUrl.trim();

    if (!url) {
      setErrorMessage("Please enter an image URL.");
      return;
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(url);
    } catch {
      setErrorMessage("Please enter a valid image URL.");
      return;
    }

    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      setErrorMessage("Only HTTP and HTTPS image URLs are supported.");
      return;
    }

    setErrorMessage("");

    const image = new Image();

    image.onload = () => {
      if (selectedImage?.startsWith("blob:")) {
        URL.revokeObjectURL(selectedImage);
      }

      setSelectedImage(url);
      setFileName(url.split("/").pop()?.split("?")[0] || "Online image");
    };

    image.onerror = () => {
      setErrorMessage(
        "Image could not be loaded. Try a direct image link from another source.",
      );
    };

    image.src = url;
  };

  const handleAnalyze = async () => {
    const token = sessionStorage.getItem("pixelproof-token");

    if (!token) {
      setShowLoginPrompt(true);
      return;
    }

    if (!selectedFile) {
      setErrorMessage(
        "Please select an image file. Online image URLs are not supported for upload yet.",
      );
      return;
    }

    try {
      setUploadLoading(true);
      setErrorMessage("");

      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/history/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Image upload failed.");
      }

      setDetectionResult({
        prediction: data.prediction,
        confidence: data.confidence,
        probabilities: data.probabilities,
        imageName: fileName,
        imageUrl: selectedImage,
      });
      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);

      // Refresh detection history
      const historyResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const historyData = await historyResponse.json();

      if (historyResponse.ok) {
        setDetectionHistory(historyData.history || []);
      }
    } catch (error) {
      console.error("Image Upload Error:", error);
      setErrorMessage(error.message || "Image upload failed.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("pixelproof-token");
    sessionStorage.removeItem("pixelproof-user");

    setIsLoggedIn(false);
    setCurrentUser({});
    setShowLoginPrompt(false);

    navigate("/");
  };

  return (
    <div className={`detector-page ${darkMode ? "dark-mode" : ""}`}>
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      {showLoginPrompt && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: darkMode ? "#17152b" : "#ffffff",
              color: darkMode ? "#ffffff" : "#17152b",
              padding: "35px",
              borderRadius: "18px",
              maxWidth: "420px",
              width: "100%",
              textAlign: "center",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowLoginPrompt(false)}
              style={{
                position: "absolute",
                right: "15px",
                top: "12px",
                border: "none",
                background: "transparent",
                color: "inherit",
                fontSize: "22px",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <div style={{ fontSize: "38px", marginBottom: "15px" }}>🔐</div>

            <h2>Login Required</h2>

            <p style={{ opacity: 0.75, margin: "15px 0 25px" }}>
              Create an account or log in to analyze your image and explore its
              authenticity.
            </p>

            <Link
              to="/login"
              className="auth-submit"
              style={{
                display: "block",
                textDecoration: "none",
                marginBottom: "12px",
              }}
            >
              Log in to continue →
            </Link>

            <Link
              to="/signup"
              style={{
                display: "block",
                color: darkMode ? "#a99bff" : "#6255e7",
                marginTop: "15px",
                textDecoration: "none",
              }}
            >
              Don't have an account? Sign up
            </Link>
          </div>
        </div>
      )}

      <nav className="top-navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">P</span>
          <span>PixelProof</span>
          <span className="brand-badge">AI</span>
        </a>

        <div className="nav-links">
          <a className="nav-link active" href="#home">
            Home
          </a>
          <a className="nav-link" href="#detector">
            AI Detector
          </a>
          <a className="nav-link" href="#how-it-works">
            How it works
          </a>
          <a className="nav-link" href="#about">
            About
          </a>
        </div>

        <div className="nav-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          {isLoggedIn ? (
            <>
              <span className="auth-nav-btn">
                Hi,{" "}
                {currentUser.name ||
                  currentUser.username ||
                  currentUser.email?.split("@")[0] ||
                  "User"}
              </span>

              <button
                type="button"
                className="auth-nav-btn auth-nav-primary"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="auth-nav-btn">
                Log in
              </Link>

              <Link to="/signup" className="auth-nav-btn auth-nav-primary">
                Sign up
              </Link>
            </>
          )}
          <a className="nav-cta" href="#detector">
            Try Detector <span>↗</span>
          </a>
        </div>
      </nav>

      <main id="home">
        <section className="hero-stage">
          <div className="stage-glow stage-glow-left" aria-hidden="true"></div>
          <div className="stage-glow stage-glow-right" aria-hidden="true"></div>

          <aside
            className="floating-visual floating-visual-left"
            aria-hidden="true"
          >
            <div className="visual-card-topline">
              <span className="visual-live-dot"></span>
              IMAGE SCAN
            </div>
            <div className="visual-image-art">
              <div className="visual-art-sun"></div>
              <div className="visual-art-mountain visual-art-mountain-back"></div>
              <div className="visual-art-mountain visual-art-mountain-front"></div>
              <div className="visual-scan-line"></div>
            </div>
            <div className="visual-card-caption">
              <span className="visual-caption-icon">⌕</span>
              <span>
                <strong>Visual analysis</strong>
                <small>Image pattern preview</small>
              </span>
            </div>
          </aside>

          <aside
            className="floating-visual floating-visual-right"
            aria-hidden="true"
          >
            <div className="visual-card-topline">
              <span className="visual-sparkle">✦</span>
              ANALYSIS PREVIEW
            </div>
            <div className="visual-preview-icon">
              <span className="preview-corner preview-corner-tl"></span>
              <span className="preview-corner preview-corner-tr"></span>
              <span className="preview-corner preview-corner-bl"></span>
              <span className="preview-corner preview-corner-br"></span>
              <span className="preview-scan-symbol">✧</span>
            </div>
            <div className="visual-card-caption">
              <span className="visual-caption-icon">✓</span>
              <span>
                <strong>Ready to inspect</strong>
                <small>Upload an image to begin</small>
              </span>
            </div>
          </aside>

          <section className="hero-section">
            <div className="hero-badge">
              <span className="status-dot"></span>
              AI IMAGE ANALYSIS
            </div>

            <h1>
              Is your image <span>real or AI?</span>
            </h1>

            <p className="hero-description">
              Discover the difference between real photographs and AI-generated
              images with our image analysis platform.
            </p>

            <div className="trust-note">
              <span>✦</span> Simple to use
              <span className="note-divider">•</span>
              Built for image authenticity research
            </div>
          </section>

          <section className="detector-section" id="detector">
            <div className="detector-heading">
              <div>
                <span className="eyebrow">IMAGE DETECTOR</span>
                <h2>Analyze an image</h2>
                <p>Upload an image to get started.</p>
              </div>

              <div className="supported-format">
                <span>▧</span> JPG · PNG · WEBP
              </div>
            </div>

            <div
              className={`upload-zone ${selectedImage ? "has-image" : ""}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();

                const file = event.dataTransfer.files?.[0];

                const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
                if (!file) return;

                if (!allowedTypes.includes(file.type)) {
                  setErrorMessage("Please select a JPG, PNG, or WEBP image.");
                  return;
                }
                if (file.size > 10 * 1024 * 1024) {
                  setErrorMessage("Image size must be less than 10 MB.");
                  return;
                }

                if (selectedImage?.startsWith("blob:")) {
                  URL.revokeObjectURL(selectedImage);
                }
                setSelectedImage(URL.createObjectURL(file));
                setSelectedFile(file);
                setFileName(file.name);
                setErrorMessage("");
                setImageUrl("");
              }}
            >
              {selectedImage ? (
                <div className="preview-container">
                  <img
                    src={selectedImage}
                    alt="Selected image preview"
                    className="image-preview"
                  />

                  <div className="preview-info">
                    <div className="file-icon">IMG</div>

                    <div className="file-details">
                      <strong>{fileName}</strong>
                      <span>Image selected successfully</span>
                    </div>

                    <button
                      className="remove-image-btn"
                      onClick={handleRemoveImage}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="upload-content">
                  <div className="upload-illustration">
                    <svg
                      viewBox="0 0 48 48"
                      width="42"
                      height="42"
                      fill="none"
                      aria-hidden="true"
                    >
                      <rect
                        x="7"
                        y="7"
                        width="34"
                        height="34"
                        rx="9"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="3.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M9 33L20 23L27 30L32 25L40 33"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <h3>Drop your image here</h3>
                  <p>Drag and drop your file, or browse from your device.</p>

                  <button
                    className="browse-btn"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span>↑</span> Choose an image
                  </button>

                  <span className="upload-hint">
                    Supported image formats: JPG, PNG, WEBP
                  </span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                hidden
              />
            </div>
            {!selectedImage && (
              <div className="url-upload">
                <div className="url-divider">
                  <span>OR</span>
                </div>

                <label htmlFor="image-url">Upload using image URL</label>

                <div className="url-input-row">
                  <input
                    id="image-url"
                    type="url"
                    value={imageUrl}
                    onChange={(event) => setImageUrl(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleLoadImageUrl();
                      }
                    }}
                    placeholder="https://example.com/image.jpg"
                  />

                  <button type="button" onClick={handleLoadImageUrl}>
                    Load image
                  </button>
                </div>

                <p className="paste-hint">
                  Tip: Copy an image and press Ctrl + V to paste it.
                </p>

                {errorMessage && (
                  <p className="upload-error" role="alert">
                    {errorMessage}
                  </p>
                )}
              </div>
            )}

            <div className="privacy-note">
              <span>ⓘ</span>
              Select an image to preview it. AI analysis will be connected after
              the detection model is integrated.
            </div>

            <button
              className="analyze-btn"
              type="button"
              disabled={!selectedImage || uploadLoading}
              onClick={handleAnalyze}
            >
              {uploadLoading ? "Uploading Image..." : "Analyze Image"}
              {!uploadLoading && <span> →</span>}
            </button>
          </section>
        </section>

        {detectionResult && (
          <section className="detection-result" ref={resultRef}>
            <div className="result-header">
              <div>
                <span className="eyebrow">ANALYSIS REPORT</span>
                <h2>Detection Result</h2>
              </div>

              <button
                className="result-close"
                onClick={() => setDetectionResult(null)}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="result-content">
              <img
                src={detectionResult.imageUrl}
                alt="Analyzed image"
                className="result-image"
              />

              <div className="result-details">
                <span className="result-label">
                  {detectionResult.prediction === "FAKE"
                    ? "AI Generated Image"
                    : "Real Image"}
                </span>

                <h3>{detectionResult.prediction}</h3>

                <div className="result-confidence">
                  <strong>{detectionResult.confidence}%</strong>
                  <span>Model confidence score</span>
                </div>

                <div className="result-progress">
                  <div
                    style={{
                      width: `${detectionResult.confidence}%`,
                    }}
                  />
                </div>

                <div className="result-probabilities">
                  <span>
                    REAL: {detectionResult.probabilities?.REAL ?? "N/A"}%
                  </span>
                  <span>
                    FAKE: {detectionResult.probabilities?.FAKE ?? "N/A"}%
                  </span>
                </div>

                <p className="result-filename">
                  File: {detectionResult.imageName}
                </p>
              </div>
            </div>

            <p className="result-disclaimer">
              Note: This result is a model prediction, not a guarantee of image
              authenticity.
            </p>
          </section>
        )}

        {isLoggedIn && (
          <section
            className="history-section"
            style={{
              maxWidth: "1100px",
              margin: "50px auto",
              padding: "30px 20px",
            }}
          >
            <div style={{ marginBottom: "25px" }}>
              <span className="eyebrow">YOUR ACTIVITY</span>
              <h2>Recent Detection History</h2>
              <p>Your previously uploaded images will appear here.</p>
            </div>

            {historyLoading && <p>Loading your history...</p>}

            {historyError && (
              <p role="alert" style={{ color: "red" }}>
                {historyError}
              </p>
            )}

            {!historyLoading &&
              !historyError &&
              detectionHistory.length === 0 && (
                <p>No detection history found yet.</p>
              )}

            {!historyLoading &&
              detectionHistory.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    padding: "18px",
                    marginBottom: "12px",
                    border: "1px solid rgba(128,128,128,0.25)",
                    borderRadius: "12px",
                  }}
                >
                  <div>
                    <strong>{item.image_name}</strong>
                    <p style={{ margin: "6px 0", opacity: 0.7 }}>
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <strong>{item.prediction || "Analysis pending"}</strong>
                    <p style={{ margin: "6px 0", opacity: 0.7 }}>
                      {item.confidence != null
                        ? `${item.confidence}% confidence`
                        : "Confidence unavailable"}
                    </p>
                  </div>
                </div>
              ))}
          </section>
        )}

        <section className="features-section" id="how-it-works">
          <div className="section-intro">
            <span className="eyebrow">MADE TO BE SIMPLE</span>
            <h2>Image analysis, made easier.</h2>
            <p>
              A simple interface designed to help explore image authenticity.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon purple">↑</div>
              <h3>1. Upload an image</h3>
              <p>Choose an image from your device using the upload area.</p>
            </article>

            <article className="feature-card">
              <div className="feature-icon blue">⌕</div>
              <h3>2. Analyze the image</h3>
              <p>The integrated detection model will examine the image.</p>
            </article>

            <article className="feature-card">
              <div className="feature-icon green">✓</div>
              <h3>3. Review the result</h3>
              <p>
                View the predicted category and model score when analysis is
                available.
              </p>
            </article>
          </div>
        </section>

        <section className="about-section" id="about">
          <span className="eyebrow">ABOUT THE PROJECT</span>
          <h2>Understanding image authenticity</h2>
          <p>
            This academic project aims to explore deep-learning-based image
            detection and present its predictions through a user-friendly web
            application. Results may vary depending on the image and the
            capabilities of the selected model.
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">P</span>
          <span>PixelProof</span>
        </a>

        <p>AI Image Detector · Academic Minor Project</p>

        <a href="#home" className="back-to-top">
          Back to top ↑
        </a>
      </footer>
    </div>
  );
};

export default Dashboard;
