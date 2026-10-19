import React, { useEffect, useState } from "react";
import "./About.css";

const ABOUT_JSON_URL =
  "https://raw.githubusercontent.com/hyloosec-official-creator/hyloosec-documentation/main/about/about.json";

const About = () => {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const fetchAboutData = async () => {
      setLoading(true);
      setError(false);

      try {
        const response = await fetch(ABOUT_JSON_URL, {
          signal: controller.signal,
          cache: "no-cache",
        });

        if (!response.ok) {
          throw new Error("Unable to load About content.");
        }

        const data = await response.json();

        if (!data || !Array.isArray(data.sections)) {
          throw new Error("Invalid About JSON structure.");
        }

        if (isActive) {
          setAboutData(data);
        }
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("Failed to load About page:", err);

        if (isActive) {
          setError(true);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchAboutData();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [retryCount]);

  if (loading) {
    return (
      <main className="about-page about-state">
        <div className="about-state-spinner" />
        <h2>Loading About HylooSec...</h2>
        <p>Preparing information about our platform.</p>
      </main>
    );
  }

  if (error || !aboutData) {
    return (
      <main className="about-page about-state">
        <div className="about-state-icon">!</div>

        <h2>Unable to Load About Page</h2>

        <p>
          Please check your internet connection and try again.
        </p>

        <button
          type="button"
          className="about-retry-button"
          onClick={() => setRetryCount((count) => count + 1)}
        >
          Try Again
        </button>
      </main>
    );
  }

  return (
    <main className="about-page">
      {/* Hero */}
      <header className="about-hero">
        <span className="about-eyebrow">
          About HylooSec
        </span>

        <h1>{aboutData.title}</h1>

        {aboutData.tagline && (
          <p className="about-tagline">
            {aboutData.tagline}
          </p>
        )}

        {aboutData.intro && (
          <p className="about-intro">
            {aboutData.intro}
          </p>
        )}

        <div className="about-hero-decoration" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </header>

      {/* Sections rendered from about.json */}
      <div className="about-sections">
        {aboutData.sections.map((section, index) => {
          const isConnect = section.id === "connect";

          const hasItems =
            Array.isArray(section.items) &&
            section.items.length > 0;

          const hasLinks =
            Array.isArray(section.links) &&
            section.links.length > 0;

          const isWide = hasItems || hasLinks;

          return (
            <section
              key={section.id || section.title}
              className={[
                "about-section",
                isWide ? "about-section--wide" : "",
                isConnect ? "about-section--connect" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="about-section-heading">
                <span className="about-section-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h2>{section.title}</h2>
              </div>

              {/* Paragraphs */}
              {Array.isArray(section.paragraphs) &&
                section.paragraphs.length > 0 && (
                  <div className="about-paragraphs">
                    {section.paragraphs.map((paragraph, pIndex) => (
                      <p key={`${section.id}-paragraph-${pIndex}`}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}

              {/* Principles and other items */}
              {hasItems && (
                <div className="about-principles-grid">
                  {section.items.map((item, itemIndex) => (
                    <article
                      className="about-principle-card"
                      key={`${section.id}-${item.title || itemIndex}`}
                    >
                      <span className="about-principle-number">
                        {String(itemIndex + 1).padStart(2, "0")}
                      </span>

                      <h3>{item.title}</h3>

                      <p>{item.description}</p>
                    </article>
                  ))}
                </div>
              )}

              {/* Official links */}
              {hasLinks && (
                <div className="about-links-grid">
                  {section.links.map((link, linkIndex) => {
                    if (!link.url || !link.label) {
                      return null;
                    }

                    const isExternal = /^https?:\/\//i.test(link.url);

                    const displayUrl = link.url.startsWith("mailto:")
                      ? link.url.slice(7)
                      : link.url.replace(/^https?:\/\//i, "");

                    return (
                      <a
                        key={`${section.id}-link-${linkIndex}`}
                        className="about-link-card"
                        href={link.url}
                        target={isExternal ? "_blank" : undefined}
                        rel={
                          isExternal
                            ? "noopener noreferrer"
                            : undefined
                        }
                      >
                        <span className="about-link-content">
                          <span className="about-link-label">
                            {link.label}
                          </span>

                          <span className="about-link-url">
                            {displayUrl}
                          </span>
                        </span>

                        <span
                          className="about-link-arrow"
                          aria-hidden="true"
                        >
                          ↗
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
};

export default About;