import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setView } from "../../../../Slice/authSlice";
import "./CreateDocumentation.css";

const SETTINGS_URL =
  "https://raw.githubusercontent.com/hyloosec-official-creator/hyloosec-documentation/main/user-manual/settings.json";

const SettingDocumentation = ({ onHome }) => {
  const dispatch = useDispatch();

  const [documentation, setDocumentation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDocumentation = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(SETTINGS_URL);

        if (!response.ok) {
          throw new Error("Failed to fetch documentation");
        }

        const data = await response.json();
        setDocumentation(data);
      } catch (err) {
        console.error("Settings documentation fetch error:", err);
        setError("Unable to load Settings documentation.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentation();
  }, []);

  const goToLogin = () => {
    window.history.pushState({}, "", "/");
    dispatch(setView("login"));
  };

  if (loading) {
    return (
      <div className="documentation-loading">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="documentation-error">
        <p>{error}</p>

        <div className="documentation-navigation">
          <button
            className="documentation-nav-btn"
            onClick={onHome}
          >
            ← Home
          </button>

          <button
            className="documentation-nav-btn"
            onClick={goToLogin}
          >
            Login →
          </button>
        </div>
      </div>
    );
  }

  if (!documentation) {
    return null;
  }

  const renderBlock = (block, index) => {
    switch (block.type) {
      case "paragraph":
        return (
          <p key={index}>
            {block.text}
          </p>
        );

      case "info":
        return (
          <div
            className="documentation-info"
            key={index}
          >
            {block.title && (
              <strong>{block.title}</strong>
            )}

            <p>{block.text}</p>
          </div>
        );

      case "warning":
        return (
          <div
            className="documentation-warning"
            key={index}
          >
            {block.title && (
              <strong>{block.title}</strong>
            )}

            <p>{block.text}</p>
          </div>
        );

      case "tip":
        return (
          <div
            className="documentation-tip"
            key={index}
          >
            {block.title && (
              <strong>{block.title}</strong>
            )}

            <p>{block.text}</p>
          </div>
        );

      case "list":
      case "security-guidelines":
        return (
          <div key={index}>
            {block.title && (
              <h3>{block.title}</h3>
            )}

            <ul>
              {block.items?.map((item, i) => (
                <li key={i}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );

      case "feature-list":
        return (
          <div key={index}>
            {block.title && (
              <h3>{block.title}</h3>
            )}

            <div className="documentation-field-guide">
              {block.items?.map((item, i) => (
                <div
                  className="documentation-field"
                  key={i}
                >
                  <h4>{item.name}</h4>

                  {item.description && (
                    <p>{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "steps":
        return (
          <div
            className="documentation-steps"
            key={index}
          >
            {block.items?.map((item) => (
              <div
                className="documentation-step"
                key={item.step}
              >
                <div className="step-number">
                  {item.step}
                </div>

                <div className="step-content">
                  <h3>{item.title}</h3>

                  {item.description && (
                    <p>{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case "troubleshooting-list":
        return (
          <div
            className="documentation-troubleshooting"
            key={index}
          >
            {block.items?.map((item, i) => (
              <div
                className="troubleshooting-item"
                key={i}
              >
                <h3>{item.problem}</h3>

                <p>{item.solution}</p>
              </div>
            ))}
          </div>
        );

      case "field-guide":
        return (
          <div
            className="documentation-field-guide"
            key={index}
          >
            {block.fields?.map((field, i) => (
              <div
                className="documentation-field"
                key={i}
              >
                <h4>
                  {field.name}

                  {field.required && (
                    <span className="required">
                      {" "}*
                    </span>
                  )}
                </h4>

                {field.description && (
                  <p>{field.description}</p>
                )}

                {field.example && (
                  <p>
                    <strong>Example:</strong>{" "}
                    {field.example}
                  </p>
                )}

                {field.important && (
                  <p>
                    <strong>Important:</strong>{" "}
                    {field.important}
                  </p>
                )}

                {field.options && (
                  <ul>
                    {field.options.map((option, j) => (
                      <li key={j}>
                        <strong>
                          {option.label}
                        </strong>
                        {" — "}
                        {option.description}
                      </li>
                    ))}
                  </ul>
                )}

                {field.recommendations && (
                  <ul>
                    {field.recommendations.map(
                      (recommendation, j) => (
                        <li key={j}>
                          {recommendation}
                        </li>
                      )
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className="documentation-page">
      <header className="documentation-header">
        <h1>{documentation.title}</h1>

        {documentation.description && (
          <p className="documentation-description">
            {documentation.description}
          </p>
        )}

        <div className="documentation-meta">
          {documentation.version && (
            <span>
              Version {documentation.version}
            </span>
          )}

          {documentation.lastUpdated && (
            <span>
              Updated {documentation.lastUpdated}
            </span>
          )}

          {documentation.estimatedTime && (
            <span>
              {documentation.estimatedTime}
            </span>
          )}
        </div>
      </header>

      <div className="documentation-body">
        {documentation.sections?.map(
          (section, index) => (
            <section
              className="documentation-section"
              key={section.id || index}
            >
              {section.title && (
                <h2>{section.title}</h2>
              )}

              {section.description && (
                <p>{section.description}</p>
              )}

              {section.blocks?.map(renderBlock)}
            </section>
          )
        )}
      </div>

      <div className="documentation-navigation">
        <button
          className="documentation-nav-btn"
          onClick={onHome}
        >
          ← Home
        </button>

        <button
          className="documentation-nav-btn"
          onClick={goToLogin}
        >
          Login →
        </button>
      </div>
    </section>
  );
};

export default SettingDocumentation;