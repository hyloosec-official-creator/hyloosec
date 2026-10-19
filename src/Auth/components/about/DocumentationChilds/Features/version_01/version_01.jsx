import React, { useEffect, useState } from "react";
import "./version_01.css";

const FEATURES_JSON_URL =
  "https://raw.githubusercontent.com/hyloosec-official-creator/hyloosec-documentation/main/features/hyloosec_version_01.json";

const Version01 = ({ onHome }) => {
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const fetchFeatures = async () => {
      setLoading(true);
      setError(false);

      try {
        const response = await fetch(FEATURES_JSON_URL, {
          signal: controller.signal,
          cache: "no-cache",
        });

        if (!response.ok) {
          throw new Error(`Failed to load features: ${response.status}`);
        }

        const data = await response.json();

        if (!data || !Array.isArray(data.sections)) {
          throw new Error("Invalid features JSON structure.");
        }

        if (isActive) {
          setFeatures(data);
        }
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("Failed to load HylooSec V1 features:", err);

        if (isActive) {
          setError(true);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchFeatures();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [retryCount]);

  // Loading state
  if (loading) {
    return (
      <main className="version-01-page version-01-state">
        <div className="version-01-spinner" />

        <h2>Loading HylooSec V1...</h2>

        <p>Fetching the features and preparing the documentation.</p>
      </main>
    );
  }

  // Error state
  if (error || !features) {
    return (
      <main className="version-01-page version-01-state">
        <div className="version-01-error-icon">!</div>

        <h2>Unable to Load Features</h2>

        <p>
          We couldn't load the HylooSec V1 features. Please check your
          connection and try again.
        </p>

        <button
          type="button"
          className="version-01-retry"
          onClick={() => setRetryCount((count) => count + 1)}
        >
          Try Again
        </button>
      </main>
    );
  }

  return (
    <main className="version-01-page">
      {/* =========================
          VERSION HEADER
          ========================= */}

      <header className="version-01-hero">
        <div className="version-01-badges">
          <span className="version-01-badge">HylooSec Features</span>

          <span className="version-01-version">{features.version || "V1"}</span>
        </div>

        <h1>{features.title}</h1>

        {features.tagline && (
          <p className="version-01-tagline">{features.tagline}</p>
        )}

        {features.intro && <p className="version-01-intro">{features.intro}</p>}
      </header>

      {/* =========================
          FEATURE SECTIONS
          ========================= */}

      <div className="version-01-sections">
        {features.sections.map((section, sectionIndex) => (
          <section
            className="version-01-section"
            key={section.id || section.title}
          >
            {/* Section heading */}
            <div className="version-01-section-header">
              <div className="version-01-section-number">
                {String(sectionIndex + 1).padStart(2, "0")}
              </div>

              <div className="version-01-section-heading">
                <h2>{section.title}</h2>
              </div>
            </div>

            {/* Section description */}
            {section.description && (
              <p className="version-01-section-description">
                {section.description}
              </p>
            )}

            {/* Feature cards */}
            <div className="version-01-items">
              {(Array.isArray(section.items) ? section.items : []).map(
                (item, itemIndex) => (
                  <article
                    className="version-01-item"
                    key={`${section.id || sectionIndex}-${
                      item.title || itemIndex
                    }`}
                  >
                    <div className="version-01-item-number">
                      {String(itemIndex + 1).padStart(2, "0")}
                    </div>

                    <div className="version-01-item-content">
                      <h3>{item.title}</h3>

                      {item.description && <p>{item.description}</p>}
                    </div>
                  </article>
                ),
              )}
            </div>
          </section>
        ))}
      </div>

       {typeof onHome === "function" && (
        <button type="button" className="version-01-back" onClick={onHome}>
          ← Back to Documentation
        </button>
      )}
    </main>
  );
};

export default Version01;
