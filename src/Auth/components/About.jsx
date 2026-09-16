import React from "react";
import { Helmet } from "react-helmet-async";
import Documentation from "./about/Documentation";
import "./About.css";

const About = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "HylooSec",
    operatingSystem: "Web",
    applicationCategory: "CommunicationApplication",
    description:
      "Secure, E2EE messaging platform with privacy-first architecture.",
  };

  return (
    <div className="about-content">
      <Helmet>
        <title>About HylooSec | Secure Anonymous Messaging Platform</title>

        <meta
          name="description"
          content="HylooSec is a cutting-edge secure messaging platform. Learn about our E2EE technology, privacy-first architecture, and vision for digital sovereignty."
        />

        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <Documentation />
    </div>
  );
};

export default About;