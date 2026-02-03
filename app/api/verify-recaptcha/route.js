import { NextResponse } from "next/server";

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

async function verifyRecaptcha(token) {
  // در حالت توسعه، اگر کلید وجود ندارد، از کلید تستی استفاده کن
  let secret = RECAPTCHA_SECRET;
  
  if (IS_DEVELOPMENT && !secret) {
    console.warn('⚠️ Using test reCAPTCHA secret in development mode');
    // این کلید تستی عمومی گوگل است که همیشه کار می‌کند
    secret = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';
  }

  if (!secret) {
    console.error('❌ RECAPTCHA_SECRET is not configured');
    throw new Error('RECAPTCHA_SECRET is not configured');
  }

  try {
    console.log('🔐 Verifying reCAPTCHA token...');
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    });
    
    const data = await res.json();
    console.log('📊 reCAPTCHA response:', {
      success: data.success,
      score: data.score,
      action: data.action,
      hostname: data.hostname
    });
    
    return data;
    
  } catch (err) {
    console.error("❌ reCAPTCHA verify error:", err);
    
    // در حالت توسعه، یک پاسخ تستی برگردان
    if (IS_DEVELOPMENT) {
      console.warn('⚠️ Returning test response for development');
      return {
        success: true,
        score: 0.7 + (Math.random() * 0.3), // نمره تصادفی بین 0.7 تا 1.0
        action: 'test',
        hostname: 'localhost',
        challenge_ts: new Date().toISOString()
      };
    }
    
    return { success: false };
  }
}

export async function POST(req) {
  try {
    const { token, action } = await req.json();
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: "No reCAPTCHA token provided" },
        { status: 400 }
      );
    }
    
    const result = await verifyRecaptcha(token);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "reCAPTCHA verification failed",
          score: result.score || 0,
          details: result
        },
        { status: 400 }
      );
    }
    
    // برگرداندن نمره واقعی
    const score = result.score || 0;
    const isAboveThreshold = score >= 0.4;
    
    console.log(`✅ reCAPTCHA verification passed. Score: ${score}, Threshold: 0.4, Passed: ${isAboveThreshold}`);
    
    return NextResponse.json({
      success: isAboveThreshold,
      score,
      action: result.action,
      timestamp: result.challenge_ts,
      hostname: result.hostname,
      isAboveThreshold,
      rawScore: score // نمره خام برای نمایش
    });
    
  } catch (error) {
    console.error("❌ verify-recaptcha error:", error);
    
    // در حالت توسعه، یک پاسخ تستی برگردان
    if (IS_DEVELOPMENT) {
      const testScore = 0.7 + (Math.random() * 0.3);
      return NextResponse.json({
        success: true,
        score: testScore,
        action: 'development_fallback',
        timestamp: new Date().toISOString(),
        hostname: 'localhost',
        isAboveThreshold: testScore >= 0.4,
        rawScore: testScore,
        isDevelopment: true
      });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Server error",
        score: 0 
      },
      { status: 500 }
    );
  }
}