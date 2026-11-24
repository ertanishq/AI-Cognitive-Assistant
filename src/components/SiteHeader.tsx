"use client"

import { useState } from "react"
import Link from "next/link"
import { Leaf, Menu, X } from "lucide-react"

const links = [
  { label: "Home", href: "#home" },
  { label: "About us", href: "#about" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Contact", href: "#contact" },
]

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Daymark Care home">
      <span className="brand__mark" aria-hidden="true">
        <Leaf size={19} strokeWidth={2.1} />
      </span>
      <span className="brand__name">daymark<span>care</span></span>
    </Link>
  )
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Brand />
        <button
          className="mobile-menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav
          className={`site-nav${menuOpen ? " site-nav--open" : ""}`}
          id="primary-navigation"
          aria-label="Main navigation"
        >
          <div className="site-nav__links">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ))}
          </div>
          <Link className="button button--small button--outline" href="/login/user" onClick={() => setMenuOpen(false)}>
            Login
          </Link>
        </nav>
      </div>
    </header>
  )
}
