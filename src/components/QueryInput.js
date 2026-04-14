"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./QueryInput.module.css";

export default function QueryInput({ onSubmit, isLoading, loadingStage }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    onSubmit(value.trim());
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className={styles.wrapper} onSubmit={handleSubmit}>
      <div className={`${styles.inputContainer} ${isLoading ? styles.loading : ""}`}>
        <div className={styles.iconLeft}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
        </div>
        <textarea
          ref={textareaRef}
          className={styles.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about Earth observation data..."
          rows={1}
          disabled={isLoading}
          id="query-input"
        />
        <button
          type="submit"
          className={styles.submitButton}
          disabled={!value.trim() || isLoading}
          id="query-submit"
        >
          {isLoading ? (
            <div className={styles.spinner} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      {/* Loading Stage Indicator */}
      {isLoading && loadingStage && (
        <div className={styles.stageBar}>
          <div className={styles.stageProgress} />
          <div className={styles.stageText}>
            <div className={styles.typingDots}>
              <span />
              <span />
              <span />
            </div>
            {loadingStage}
          </div>
        </div>
      )}
    </form>
  );
}
