import {
  Activity,
  Bell,
  Brain,
  ChartNoAxesCombined,
  HeartHandshake,
  ListChecks,
  MessageCircleHeart,
  Pill,
  ShieldCheck,
  UserRound,
  UsersRound,
  ArrowRight,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"

const steps = [
  {
    number: "01",
    title: "Practice at your own pace",
    description:
      "Try gentle memory activities designed to be clear, familiar and easy to return to.",
  },
  {
    number: "02",
    title: "Notice progress over time",
    description:
      "Keep track of completed activities and see a simple record to share with your care team.",
  },
  {
    number: "03",
    title: "Make everyday routines easier",
    description:
      "Use helpful reminders and stay connected with the people supporting you.",
  },
]

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Brain,
    title: "Cognitive activities",
    description: "Approachable memory games for a little practice, whenever it suits you.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Progress reports",
    description: "A clear view of activity and progress over time, ready to discuss with a care team.",
  },
  {
    icon: Pill,
    title: "Medicine reminders",
    description: "Gentle prompts to help keep medicine routines on track.",
  },
  {
    icon: ListChecks,
    title: "Daily tasks",
    description: "Keep important plans and everyday to-dos in one easy-to-follow place.",
  },
  {
    icon: MessageCircleHeart,
    title: "Personal assistance",
    description: "Personalized guidance for everyday questions, with clinical care always remaining human-led.",
  },
  {
    icon: HeartHandshake,
    title: "Caregiver support",
    description: "Help caregivers stay informed and coordinate support with the person they care for.",
  },
  {
    icon: Bell,
    title: "Helpful notifications",
    description: "Timely activity and routine reminders, designed to be useful rather than overwhelming.",
  },
]

type PortalItem = {
  icon: LucideIcon
  title: string
  description: string
  loginText: string
  loginHref: string
  signUpText?: string
  signUpHref?: string
}

const portals: PortalItem[] = [
  {
    icon: UserRound,
    title: "User / Patient",
    description: "Access cognitive activities, daily reminders and personalized assistance.",
    loginText: "Login as Patient",
    loginHref: "/login/user",
    signUpText: "Sign Up as Patient",
    signUpHref: "/signup/user",
  },
  {
    icon: HeartHandshake,
    title: "Caregiver",
    description: "Review shared progress and help coordinate everyday care activities.",
    loginText: "Login as Caregiver",
    loginHref: "/login/caregiver",
    signUpText: "Sign Up as Caregiver",
    signUpHref: "/signup/caregiver",
  },
  {
    icon: ShieldCheck,
    title: "Administrator",
    description: "Manage platform access and oversee account administration.",
    loginText: "Admin Login",
    loginHref: "/login/admin",
  },
]

export function AboutSection() {
  return (
    <section className="section about-section" id="about" aria-labelledby="about-heading">
      <div className="section-container about-section__layout">
        <div className="about-section__copy">
          <p className="eyebrow">About the platform</p>
          <h2 id="about-heading">Care, cognitive wellness and everyday assistance.</h2>
          <p className="section-lead">
            Daymark Care brings gentle cognitive activities, memory support and caregiver
            connection together in one calm, easy-to-use place.
          </p>
          <p>
            It is designed to support daily wellbeing and make routines feel more manageable.
            Activities can help people notice patterns over time, but they are not a diagnosis
            or a replacement for advice from a healthcare professional.
          </p>
          <a className="text-link" href="#how-it-works">
            Get to know how it works <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
        <figure className="about-section__image-wrap">
          <img
            className="about-section__image"
            src="/daymark-about.png"
            alt="An older man and his caregiver looking over a daily routine together at home"
            loading="lazy"
          />
          <figcaption>Support that fits into everyday life.</figcaption>
        </figure>
      </div>
    </section>
  )
}

export function HowItWorksSection() {
  return (
    <section className="section steps-section" id="how-it-works" aria-labelledby="steps-heading">
      <div className="section-container">
        <div className="section-heading section-heading--center">
          <p className="eyebrow">How it works</p>
          <h2 id="steps-heading">Simple support, in three small steps.</h2>
          <p className="section-lead">
            Start with what feels useful today. There is no rush and no need to do everything at once.
          </p>
        </div>
        <ol className="steps-list">
          {steps.map((step) => (
            <li className="step-item" key={step.number}>
              <span className="step-item__number" aria-hidden="true">{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function FeaturesSection() {
  return (
    <section className="section features-section" id="features" aria-labelledby="features-heading">
      <div className="section-container">
        <div className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">Thoughtful tools</p>
            <h2 id="features-heading">A little help for the things that matter.</h2>
          </div>
          <p className="section-lead">
            Practical tools for people living with memory changes, and for the people beside them.
          </p>
        </div>
        <ul className="features-grid">
          {features.map(({ icon: Icon, title, description }) => (
            <li className="feature-item" key={title}>
              <span className="feature-item__icon" aria-hidden="true"><Icon size={22} strokeWidth={1.8} /></span>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ul>
        <p className="medical-note">
          <Activity size={17} aria-hidden="true" />
          Daymark Care supports wellbeing. It does not diagnose or replace professional medical advice.
        </p>
      </div>
    </section>
  )
}

export function PortalSection() {
  return (
    <section className="section portal-section" id="portals" aria-labelledby="portals-heading">
      <div className="section-container">
        <div className="section-heading section-heading--center">
          <p className="eyebrow">A place for everyone</p>
          <h2 id="portals-heading">Choose your portal.</h2>
          <p className="section-lead">Select your role to access your account.</p>
        </div>
        <div className="portal-grid">
          {portals.map(({ icon: Icon, title, description, loginText, loginHref, signUpText, signUpHref }) => (
            <article className="portal-card" key={loginHref}>
              <span className="portal-card__icon" aria-hidden="true"><Icon size={23} strokeWidth={1.8} /></span>
              <h3>{title}</h3>
              <p>{description}</p>
              <div className="portal-card__actions">
                {signUpText && signUpHref ? (
                  <>
                    <Link className="button button--portal button--portal-action" href={loginHref}>
                      {loginText}
                    </Link>
                    <Link className="button button--primary button--portal-action" href={signUpHref}>
                      {signUpText} <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </>
                ) : (
                  <Link className="button button--portal button--portal-action" href={loginHref}>
                    {loginText} <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
        <p className="portal-reassurance">
          <UsersRound size={17} aria-hidden="true" />
          Your account access is private. Administrators cannot register from this page.
        </p>
      </div>
    </section>
  )
}
