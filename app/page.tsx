import Link from "next/link";
import Image from "next/image";
import "./landing.css";

export default function LandingPage() {
  return (
    <div className="landing">
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <span className="lp-logo-icon">👶</span>
            <span className="lp-logo-text">Baby Journey</span>
          </div>
          <Link href="/en/login" className="lp-nav-cta">
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-content">
          <span className="lp-hero-badge">✨ Every moment matters</span>
          <h1 className="lp-hero-title">
            Capture every precious
            <span className="lp-hero-gradient"> milestone</span>
          </h1>
          <p className="lp-hero-subtitle">
            The beautifully simple way to document your baby&apos;s first
            steps, smiles, and memories — all in one secure, private space
            shared with the people who matter most.
          </p>
          <div className="lp-hero-actions">
            <Link href="/en/login" className="lp-btn-primary">
              Get Started Free
              <span className="lp-btn-arrow">→</span>
            </Link>
            <a href="#features" className="lp-btn-secondary">
              See Features
            </a>
          </div>
        </div>
        <div className="lp-hero-visual">
          <Image
            src="/hero.png"
            alt="Baby Journey — track milestones"
            width={560}
            height={460}
            priority
            className="lp-hero-img"
          />
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" className="lp-features">
        <div className="lp-section-header">
          <h2 className="lp-section-title">
            Everything you need to cherish the journey
          </h2>
          <p className="lp-section-subtitle">
            Simple, private, and beautifully designed for modern families.
          </p>
        </div>
        <div className="lp-features-grid">
          <div className="lp-feature-card">
            <div className="lp-feature-icon">📸</div>
            <h3 className="lp-feature-title">Photo & Video Albums</h3>
            <p className="lp-feature-desc">
              Upload photos and videos directly to your baby&apos;s personal
              album. No more scrolling through thousands of camera-roll shots.
            </p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon">🔒</div>
            <h3 className="lp-feature-title">Private & Secure</h3>
            <p className="lp-feature-desc">
              Your memories are yours. End-to-end encrypted storage with
              granular sharing — only the people you invite can see your
              baby&apos;s journey.
            </p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon">👨‍👩‍👧</div>
            <h3 className="lp-feature-title">Share with Family</h3>
            <p className="lp-feature-desc">
              Invite grandparents, co-parents, and caregivers with viewer or
              editor roles. Everyone stays in the loop, on their own terms.
            </p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon">🌍</div>
            <h3 className="lp-feature-title">Multi-language</h3>
            <p className="lp-feature-desc">
              Available in English, Spanish, French, and Portuguese. Your
              family speaks different languages? Baby Journey speaks them all.
            </p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon">📱</div>
            <h3 className="lp-feature-title">Works Everywhere</h3>
            <p className="lp-feature-desc">
              Responsive design that looks stunning on phones, tablets, and
              desktops. Capture a moment from any device, instantly.
            </p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon">⚡</div>
            <h3 className="lp-feature-title">Lightning Fast</h3>
            <p className="lp-feature-desc">
              Built on cutting-edge technology with direct cloud uploads.
              Your photos appear in the album in seconds, not minutes.
            </p>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section className="lp-how">
        <div className="lp-section-header">
          <h2 className="lp-section-title">Start in under a minute</h2>
          <p className="lp-section-subtitle">
            Three simple steps to begin documenting your baby&apos;s adventure.
          </p>
        </div>
        <div className="lp-steps">
          <div className="lp-step">
            <div className="lp-step-number">1</div>
            <h3 className="lp-step-title">Create an Account</h3>
            <p className="lp-step-desc">
              Sign up with Google or a magic link — no passwords to remember.
            </p>
          </div>
          <div className="lp-step-divider" />
          <div className="lp-step">
            <div className="lp-step-number">2</div>
            <h3 className="lp-step-title">Add Your Baby</h3>
            <p className="lp-step-desc">
              Enter their name and birthday to create a personal album.
            </p>
          </div>
          <div className="lp-step-divider" />
          <div className="lp-step">
            <div className="lp-step-number">3</div>
            <h3 className="lp-step-title">Start Capturing</h3>
            <p className="lp-step-desc">
              Upload photos, videos, and captions — your journey begins!
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <span className="lp-cta-emoji">🍼</span>
          <h2 className="lp-cta-title">
            Ready to start your baby&apos;s story?
          </h2>
          <p className="lp-cta-subtitle">
            Join thousands of parents capturing precious milestones every day.
            Free to start, no credit card required.
          </p>
          <Link href="/en/login" className="lp-btn-primary lp-btn-lg">
            Create Your Free Album
            <span className="lp-btn-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-logo-icon">👶</span>
            <span className="lp-logo-text">Baby Journey</span>
          </div>
          <p className="lp-footer-copy">
            © {new Date().getFullYear()} Baby Journey. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}