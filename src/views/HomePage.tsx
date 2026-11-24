import { ArrowRight, HeartHandshake } from "lucide-react"
import { SiteFooter } from "../components/SiteFooter"
import { AboutSection, FeaturesSection, HowItWorksSection, PortalSection } from "../components/LandingSections"
import { SiteHeader } from "../components/SiteHeader"

export function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <SiteHeader />
      <main id="main-content">
        <section className="hero" id="home" aria-labelledby="hero-heading">
          <div className="section-container hero__layout">
            <div className="hero__copy">
              <p className="eyebrow"><HeartHandshake size={16} aria-hidden="true" /> Care for the everyday</p>
              <h1 id="hero-heading">Supporting better cognitive health, <em>one day at a time.</em></h1>
              <p className="hero__lead">
                Explore cognitive activities, follow daily routines and feel more supported—with
                memory assistance made for you and the people who care about you.
              </p>
              <div className="hero__actions">
                <a className="button button--primary" href="#features">
                  Explore our platform <ArrowRight size={18} aria-hidden="true" />
                </a>
                <a className="button button--text" href="#portals">Get started</a>
              </div>
              <p className="hero__note">A supportive companion for everyday wellbeing—not a medical diagnosis.</p>
            </div>
            <figure className="hero__visual">
              <img
                src="/daymark-hero.png"
                alt="An older woman and her daughter sharing a quiet moment as they look at a planner"
                fetchPriority="high"
              />
              <figcaption>
                <span className="hero__visual-mark" aria-hidden="true"><HeartHandshake size={18} /></span>
                <span><strong>Here for the everyday.</strong><br />One helpful step at a time.</span>
              </figcaption>
            </figure>
          </div>
          <div className="hero__bottom-rule" aria-hidden="true" />
        </section>

        <AboutSection />
        <HowItWorksSection />
        <FeaturesSection />
        <PortalSection />
      </main>
      <SiteFooter />
    </>
  )
}
