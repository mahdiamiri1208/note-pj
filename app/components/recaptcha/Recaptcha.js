"use client";

import { useEffect, useState } from 'react';
import styles from './recaptcha.module.css';

export default function Recaptcha({ onVerify, action = 'register' }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    executeRecaptcha();
  }, []);

  const executeRecaptcha = async () => {
    try {
      setIsLoading(true);
      setError('');

      // بارگذاری اسکریپت reCAPTCHA
      if (!window.grecaptcha) {
        await loadRecaptchaScript();
      }

      // صبر کن تا grecaptcha آماده شود
      await new Promise((resolve) => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(resolve);
        } else {
          // اگر grecaptcha هنوز لود نشده، منتظر بمان
          const checkInterval = setInterval(() => {
            if (window.grecaptcha && window.grecaptcha.ready) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
          
          // تایم‌اوت پس از 5 ثانیه
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
          }, 5000);
        }
      });

      // اجرای reCAPTCHA
      const token = await window.grecaptcha.execute(
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
        { action }
      );

      if (!token) {
        throw new Error('Failed to get reCAPTCHA token');
      }

      // بررسی توکن با سرور
      const response = await fetch('/api/auth/verify-recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      });

      const result = await response.json();

      if (result.success) {
        setScore(result.score);
        setIsVerified(true);
        setError('');
        onVerify(token, result.score);
        
        // نمایش نمره واقعی
        console.log(`✅ reCAPTCHA Score: ${result.score}`);
      } else {
        throw new Error(result.error || 'Verification failed');
      }

    } catch (err) {
      console.error('reCAPTCHA execution error:', err.message);
      setError(err.message || 'Security verification failed');
      setIsVerified(false);
      setScore(0);
      onVerify(null, 0);
      
      // در حالت توسعه، از توکن تستی استفاده کن
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using development fallback for reCAPTCHA');
        setTimeout(() => {
          const devScore = Math.random() * 0.5 + 0.4; // نمره بین 0.4 تا 0.9
          setScore(devScore);
          setIsVerified(true);
          setError('');
          onVerify('development_token', devScore);
        }, 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecaptchaScript = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.grecaptcha) {
          resolve();
        } else {
          reject(new Error('reCAPTCHA script loaded but grecaptcha not found'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load reCAPTCHA script'));
      };
      
      document.head.appendChild(script);
    });
  };

  const handleRetry = () => {
    executeRecaptcha();
  };

  // محاسبه رنگ بر اساس امتیاز واقعی
  const getScoreColor = (score) => {
    if (score >= 0.8) return '#10b981'; // قوی
    if (score >= 0.6) return '#f59e0b'; // متوسط
    if (score >= 0.4) return '#ea580c'; // ضعیف
    return '#dc2626'; // خیلی ضعیف
  };

  // محاسبه درصد و وضعیت
  const getScoreStatus = (score) => {
    if (score >= 0.8) return 'Very Good';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Poor';
  };

  return (
    <div className={styles.recaptchaContainer}>
      <div className={styles.recaptchaHeader}>
        <div className={styles.recaptchaLabel}>
          <span>Security Verification</span>
        </div>
        <div className={styles.recaptchaBranding}>
          <div className={styles.recaptchaLogo}>
            <div className={styles.recaptchaLogoInner}></div>
          </div>
          <span className={styles.recaptchaBrandText}>reCAPTCHA v3</span>
        </div>
      </div>

      <div className={styles.recaptchaCard}>
        <div className={styles.recaptchaCardHeader}>
          <div>
            <h3 className={styles.recaptchaTitle}>reCAPTCHA Protection</h3>
            <p className={styles.recaptchaSubtitle}>
              Real-time bot detection and scoring
            </p>
          </div>
        </div>

        <div className={styles.recaptchaStatus}>
          <div className={`${styles.recaptchaStatusIcon} ${
            isLoading ? styles.loading : 
            isVerified ? styles.success : 
            error ? styles.error : ''
          }`}>
            {isLoading ? (
              <div className={styles.recaptchaSpinner}></div>
            ) : isVerified ? (
              '✓'
            ) : error ? (
              '✗'
            ) : null}
          </div>
          
          <div className={styles.recaptchaStatusContent}>
            <h4 className={styles.recaptchaStatusTitle}>
              {isLoading ? 'Analyzing behavior...' : 
               isVerified ? 'Human behavior detected' : 
               error ? 'Analysis failed' : 'Ready'}
            </h4>
            <p className={styles.recaptchaStatusMessage}>
              {isLoading ? 'Checking for bot patterns...' : 
               isVerified ? `Trust score: ${(score * 100).toFixed(1)}%` : 
               error || 'Click retry to verify again.'}
            </p>
          </div>
        </div>

        {isVerified && (
          <div className={styles.recaptchaScoreSection}>
            <div className={styles.recaptchaScoreHeader}>
              <span className={styles.recaptchaScoreLabel}>Real-time Trust Score</span>
              <span 
                className={styles.recaptchaScoreValue}
                style={{ color: getScoreColor(score) }}
              >
                {(score * 100).toFixed(1)}% ({getScoreStatus(score)})
              </span>
            </div>
            <div className={styles.recaptchaScoreBar}>
              <div 
                className={styles.recaptchaScoreFill} 
                style={{ 
                  width: `${score * 100}%`,
                  backgroundColor: getScoreColor(score)
                }}
              />
            </div>
            <div className={styles.recaptchaScoreLabels}>
              <span className={styles.recaptchaScoreLabelLeft}>Bot (0%)</span>
              <span className={styles.recaptchaScoreLabelRight}>Human (100%)</span>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className={styles.recaptchaError}>
            <div className={styles.recaptchaErrorHeader}>
              <h4 className={styles.recaptchaErrorTitle}>Verification Required</h4>
            </div>
            <p className={styles.recaptchaErrorMessage}>
              {error}
            </p>
            <button 
              className={styles.recaptchaRetryBtn}
              onClick={handleRetry}
            >
              Retry Analysis
            </button>
          </div>
        )}

        <div className={styles.recaptchaFooter}>
          <p>
            <strong>Note:</strong> This score is calculated by Google's reCAPTCHA v3 
            based on your browsing behavior. Higher scores indicate more human-like behavior.
          </p>
          <p className={styles.privacyNote}>
            This site is protected by reCAPTCHA and the Google{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </a>{' '}
            apply.
          </p>
        </div>
      </div>
    </div>
  );
}