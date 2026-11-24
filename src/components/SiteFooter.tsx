import Link from "next/link"
import { Brand } from "./SiteHeader"

export function SiteFooter() {
  return (
    <footer className="site-footer" id="contact">
      <div className="section-container">
        <div className="site-footer__main">
          <div className="site-footer__brand">
            <Brand />
            <p>Steady, thoughtful support for cognitive wellbeing and everyday life.</p>
          </div>
          <div className="site-footer__links">
            <div>
              <p className="site-footer__label">Explore</p>
              <a href="/#about">About us</a>
              <a href="/#how-it-works">How it works</a>
              <a href="/#features">Features</a>
            </div>
            <div>
              <p className="site-footer__label">Portals &amp; Sign in</p>
              <Link href="/login/user">Patient login</Link>
              <Link href="/signup/user">Patient sign up</Link>
              <Link href="/login/caregiver">Caregiver login</Link>
              <Link href="/signup/caregiver">Caregiver sign up</Link>
              <Link href="/login/admin">Admin login</Link>
            </div>
          </div>
        </div>
        <div className="site-footer__legal">
          <p>© {new Date().getFullYear()} Daymark Care. All rights reserved.</p>
          <div className="site-footer__legal-links">
            <a href="#privacy-note">Privacy</a>
            <a href="#terms-note">Terms</a>
          </div>
        </div>
        <div className="site-footer__notes">
          <p id="privacy-note"><strong>Privacy:</strong> This preview does not send or save login details.</p>
          <p id="terms-note"><strong>Important:</strong> Daymark Care is a support concept, not a diagnostic or emergency service.</p>
        </div>
      </div>
    </footer>
  )
}
