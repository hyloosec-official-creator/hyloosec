import React from "react";
import { Helmet } from "react-helmet-async";
import { useDispatch } from "react-redux";
import { setView } from "../../Slice/authSlice";

const About = () => {
  const dispatch = useDispatch();

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
        {/* Helmet के अंदर स्क्रिप्ट टैग डालें */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <h1>About HylooSec</h1>
      <p className="about-intro">
        <strong>HylooSec</strong> is a cutting-edge, secure messaging platform
        designed with user privacy as its core foundation. In an era where
        digital footprints are constantly tracked and data is monetized,
        HylooSec offers a pristine, private space for hassle-free, real-time
        communication.
      </p>

      <h2>Why Choose HylooSec?</h2>
      <ul>
        <li>
          <strong>End-to-End Security (E2EE):</strong> Utilizing advanced
          cryptographic standards, we ensure that every byte of your
          communication is encrypted. Only you and your intended recipient hold
          the keys to your conversations.
        </li>
        <li>
          <strong>Privacy-First Architecture:</strong> We prioritize true
          anonymity. No phone numbers, no invasive tracking—just secure,
          peer-to-peer interaction.
        </li>
        <li>
          <strong>Real-Time Performance:</strong> Engineered for speed. Built
          with modern WebSocket-based protocols to ensure your messages reach
          their destination in milliseconds, not seconds.
        </li>
        <li>
          <strong>Lightweight & Intuitive:</strong> A minimalist UI designed to
          reduce cognitive load. We focus on the essence of communication,
          stripping away unnecessary clutter.
        </li>
      </ul>

      <h2>Technical Architecture: Built for Scale</h2>
      <p>
        HylooSec is engineered using a modern, resilient tech stack to ensure
        99.9% reliability:
      </p>
      <ul>
        <li>
          <strong>Backend Power:</strong> Powered by{" "}
          <strong>Java Spring Boot</strong> for robust, thread-safe, and
          scalable enterprise-grade backend services.
        </li>
        <li>
          <strong>Data Resilience:</strong> We leverage <strong>MongoDB</strong>{" "}
          to provide a flexible and schema-less environment, allowing for rapid
          feature deployment and high availability.
        </li>
        <li>
          <strong>Infrastructure as Code:</strong> Our platform is fully{" "}
          <strong>Dockerized</strong> and orchestrated, ensuring seamless
          deployment, security, and environment consistency whether in
          development or production.
        </li>
      </ul>

      <h2>Our Vision</h2>
      <p>
        Our goal is to redefine the landscape of digital communication. We
        believe that privacy is a fundamental human right, not a luxury.
        HylooSec is built for visionaries, developers, and everyone who values
        their digital sovereignty in an increasingly interconnected world. We
        are constantly evolving to keep your data invisible and your
        conversations yours.
      </p>

      <div className="about-cta">
        <h3>Ready to experience secure communication?</h3>
        <p>
          Join the revolution today and take control of your digital footprint.
        </p>
        <button
          onClick={() => dispatch(setView("register"))}
          className="cta-btn"
        >
          Create Free Account
        </button>
      </div>

      <button onClick={() => dispatch(setView("login"))} className="back-btn">
        ← Back to Login
      </button>
    </div>
  );
};

export default About;
