import React, { useState, useEffect } from "react";
import API from "../../api/axios.js";
import { useDispatch, useSelector } from "react-redux";
import { Eye, EyeOff, Lock, FileKey, Info } from "lucide-react";
import {
  setView,
  setAuthError,
  clearMessages,
  setRegistrationData,
} from "../../Slice/authSlice.js";
import { generateKeyPair, encryptWithPin } from "../../utils/cryptoUtils";

const Create = () => {
  const dispatch = useDispatch();
  const { error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [isLocating, setIsLocating] = useState(true);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [securityType, setSecurityType] = useState("PIN");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    fatherName: "",
    bio: "",
    dob: "",
    securityQuestion: "",
    securityAnswer: "",
    password: "",
    confirmPassword: "",
    country: "",
    region: "",
    city: "",
    ip: "",
    timestamp: "",
  });

  useEffect(() => {
    const pass = formData.password;
    if (!pass) {
      setPasswordStrength("");
      return;
    }
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasNonalphas = /\W/.test(pass);

    if (pass.length < 8) {
      setPasswordStrength("Too Short (Min 8 characters)");
    } else if (hasUpperCase && hasLowerCase && hasNumbers && hasNonalphas) {
      setPasswordStrength("Strong Password ✅");
    } else {
      setPasswordStrength("Medium: Add symbols & numbers");
    }
  }, [formData.password]);

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        // Note: Use http instead of https for the free version of ip-api
        const response = await fetch("http://ip-api.com/json/");
        const data = await response.json();

        setFormData((prev) => ({
          ...prev,
          // ip-api.com ke response keys ye hain:
          country: data.country || "Unknown",
          region: data.regionName || "Unknown",
          city: data.city || "Unknown",
          ip: data.query || "Unknown", // ip-api mein query field IP hoti hai
          timestamp: new Date().toISOString(),
        }));
      } catch (err) {
        console.error("Failed to fetch location data:", err);
        setFormData((prev) => ({
          ...prev,
          country: "Unknown",
          city: "Unknown",
          region: "Unknown",
          ip: "Unknown",
          timestamp: new Date().toISOString(),
        }));
      } finally {
        setIsLocating(false);
      }
    };

    fetchLocationData();
  }, []);

  const passwordRequirements = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[\W_]/.test(formData.password),
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (error) dispatch(clearMessages());

    if (name === "username" || name === "fatherName" || name === "bio") {
      const cleanValue = value.replace(/[^a-zA-Z\s]/g, "");
      setFormData({ ...formData, [name]: cleanValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const birthDate = new Date(formData.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred yet this year
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age < 10) {
      dispatch(setAuthError("You must be at least 10 years old to register."));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      dispatch(setAuthError("Passwords do not match!"));
      return;
    }

    if (
      formData.securityQuestion === "father" &&
      formData.fatherName.toLowerCase() !==
        formData.securityAnswer.toLowerCase()
    ) {
      dispatch(
        setAuthError(
          "Security answer must match the Father's Name provided above.",
        ),
      );
      return;
    }

    if (passwordStrength.includes("Short")) {
      dispatch(setAuthError("Password must be at least 8 characters."));
      return;
    }

    if (securityType === "PIN" && pin.length < 6) {
      dispatch(setAuthError("Security PIN must be at least 6 digits."));
      return;
    }

    try {
      const { publicKey, privateKey } = await generateKeyPair();
      const finalData = {
        ...formData,
        publicKey: publicKey,
        securityType: securityType,
      };

      if (securityType === "PIN") {
        const { encryptedKey, iv } = await encryptWithPin(privateKey, pin);
        finalData.encryptedPrivateKey = encryptedKey;
        finalData.keyIv = iv;
      }

      const response = await API.post("/api/auth/register", finalData);
      console.log("Submit hone wala data:", finalData);

      if (response.status === 200 || response.status === 201) {
        if (securityType === "FILE") {
          const element = document.createElement("a");
          const file = new Blob([privateKey], { type: "text/plain" });
          element.href = URL.createObjectURL(file);
          element.download = `${formData.username}_Secret_key.txt`;
          document.body.appendChild(element);
          element.click();
        }

        dispatch(
          setRegistrationData({
            userId: response.data,
            username: formData.username,
            password: formData.password,
          }),
        );
        dispatch(setView("success"));
      }
    } catch (err) {
      const serverMessage =
        typeof err.response?.data === "string"
          ? err.response.data
          : "Something went wrong";
      dispatch(setAuthError(serverMessage));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-user fade-in">
      <h2 className="Welcome">Create Account</h2>

      <div className="input-form">
        <input
          name="username"
          type="text"
          placeholder="Full Name"
          required
          value={formData.username}
          onChange={handleChange}
        />
        <input
          name="fatherName"
          type="text"
          placeholder="Father's Name"
          required
          value={formData.fatherName}
          onChange={handleChange}
        />
        <input
          name="bio"
          type="text"
          placeholder="Bio"
          required
          value={formData.bio}
          onChange={handleChange}
        />
        <input
          name="dob"
          type="date"
          required
          max={
            new Date(new Date().setFullYear(new Date().getFullYear() - 10))
              .toISOString()
              .split("T")[0]
          }
          value={formData.dob}
          onChange={handleChange}
        />

        {/* --- SECURITY SELECTION UI --- */}
        <div
          className="security-choice-container"
          style={{ margin: "15px 0", textAlign: "left" }}
        >
          <p style={{ fontSize: "0.9rem", color: "#888", marginBottom: "8px" }}>
            How would you like to secure your chats?
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className={`choice-btn ${securityType === "FILE" ? "active" : ""}`}
              onClick={() => setSecurityType("FILE")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border:
                  securityType === "FILE"
                    ? "2px solid #6e54ff"
                    : "1px solid #333",
                background:
                  securityType === "FILE" ? "#6e54ff22" : "transparent",
                cursor: "pointer",
                color: "black",
              }}
            >
              <FileKey size={18} style={{ marginBottom: "5px" }} />
              <br />
              Download Key
            </button>
            <button
              type="button"
              className={`choice-btn ${securityType === "PIN" ? "active" : ""}`}
              onClick={() => setSecurityType("PIN")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border:
                  securityType === "PIN"
                    ? "2px solid #6e54ff"
                    : "1px solid #333",
                background:
                  securityType === "PIN" ? "#6e54ff22" : "transparent",
                cursor: "pointer",
                color: "black",
              }}
            >
              <Lock size={18} style={{ marginBottom: "5px" }} />
              <br />
              Cloud PIN
            </button>
          </div>
        </div>

        {/* --- PIN INPUT (Only shows if PIN selected) --- */}
        {securityType === "PIN" && (
          <div
            className="password-wrapper"
            style={{ position: "relative", width: "100%" }}
          >
            <input
              type={showPin ? "text" : "password"}
              placeholder="Create 4-6 Digit Security PIN"
              maxLength="6"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} // Only numbers
              style={{
                width: "100%",
                paddingRight: "45px",
                borderColor: "#6e54ff",
              }}
            />
            <button
              type="button"
              className="eye-button"
              onClick={() => setShowPin(!showPin)}
            >
              {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        )}

        <div className="security-section">
          <select
            name="securityQuestion"
            value={formData.securityQuestion}
            onChange={handleChange}
            className="security-select"
            required
          >
            <option value="" disabled>
              Select Security Question
            </option>
            <option value="father">What is your Father name?</option>
            <option value="mother">What is your Mother name?</option>
            <option value="friend">What is your best friend name?</option>
            <option value="pet">What is your pet's name?</option>
            <option value="city">What city were you born in?</option>
          </select>
          <input
            name="securityAnswer"
            type="text"
            placeholder="Your Answer"
            required
            value={formData.securityAnswer}
            onChange={handleChange}
          />
        </div>
        {formData.securityQuestion === "father" &&
          formData.securityAnswer &&
          formData.fatherName.toLowerCase() !==
            formData.securityAnswer.toLowerCase() && (
            <p style={{ color: "orange", fontSize: "0.8rem" }}>
              ⚠️ Answer must match Father's Name
            </p>
          )}

        <div
          className="password-wrapper"
          style={{ position: "relative", width: "100%" }}
        >
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            required
            value={formData.password}
            onChange={handleChange}
            aria-label="Password"
            onFocus={() => setShowPasswordHint(true)}
            onBlur={() => setShowPasswordHint(false)}
            style={{ width: "100%", paddingRight: "45px" }}
          />
          <button
            type="button"
            className="eye-button"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          {showPasswordHint && (
            <div
              className="password-hint-box"
              style={{
                position: "absolute",
                bottom: "105%",
                left: 0,
                width: "100%",
                background: "#767676",
                color: "#fff",
                padding: "12px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                zIndex: 100,
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                border: "1px solid #333",
              }}
            >
              <p
                style={{
                  marginBottom: "8px",
                  fontWeight: "bold",
                  borderBottom: "1px solid #444",
                  paddingBottom: "4px",
                }}
              >
                Password Rules:
              </p>

              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <RequirementItem
                  reached={passwordRequirements.length}
                  label="At least 8 characters"
                />
                <RequirementItem
                  reached={passwordRequirements.upper}
                  label="One Uppercase letter (A-Z)"
                />
                <RequirementItem
                  reached={passwordRequirements.lower}
                  label="One Lowercase letter (a-z)"
                />
                <RequirementItem
                  reached={passwordRequirements.number}
                  label="One Number (0-9)"
                />
                <RequirementItem
                  reached={passwordRequirements.special}
                  label="One Special character (@, #, $, etc.)"
                />
              </ul>
            </div>
          )}
        </div>
        {formData.password && (
          <p
            style={{
              fontSize: "0.7rem",
              marginTop: "4px",
              color:
                passwordRequirements.length &&
                passwordRequirements.upper &&
                passwordRequirements.number &&
                passwordRequirements.special
                  ? "#4ade80"
                  : "#fb7185",
            }}
          >
            Strength: {passwordStrength}
          </p>
        )}

        {/* Confirm Password Field */}
        <div
          className="password-wrapper"
          style={{ position: "relative", width: "100%" }}
        >
          <input
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"} // Linked to correct state
            placeholder="Confirm Password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            aria-label="Confirm Password"
            style={{ width: "100%", paddingRight: "45px" }}
          />
          <button
            type="button"
            className="eye-button"
            onClick={toggleConfirmPasswordVisibility} // Linked to correct function
            aria-label={
              showConfirmPassword
                ? "Hide confirm password"
                : "Show confirm password"
            }
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </div>

      <button type="submit" className="auth-btn" disabled={isLocating}>
        {isLocating ? "Fetching Location..." : "Join Hyloosec"}
      </button>

      <div className="center-toggle">
        <button
          type="button"
          onClick={() => dispatch(setView("login"))}
          className="toggle-btn"
        >
          Already have an account? Login
        </button>
      </div>
    </form>
  );
};

const RequirementItem = ({ reached, label }) => (
  <li
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "4px",
      color: reached ? "#4ade80" : "#9ca3af", // Reached: Green, Not Reached: Gray
      transition: "all 0.3s ease",
    }}
  >
    <span
      style={{
        fontSize: "12px",
        display: "inline-block",
        width: "14px",
      }}
    >
      {reached ? "✅" : "○"}
    </span>
    <span
      style={{
        textDecoration: reached ? "line-through" : "none",
        opacity: reached ? 0.7 : 1,
      }}
    >
      {label}
    </span>
  </li>
);

export default Create;
