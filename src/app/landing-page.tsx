"use client";

import Link from "next/link";
import { useState } from "react";
import { KnowvaClouds } from "@/components/KnowvaClouds";
import styles from "./landing.module.css";

const BLOB =
  "M20 70C2 70 0 48 14 42 8 24 30 14 40 24 46 6 72 8 74 24 92 18 106 34 96 48 110 58 98 78 82 72 74 86 50 84 46 74 36 82 22 80 20 70Z";

export function LandingPage() {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.wrap}>
      <nav className={styles.nav}>
        <Link className={styles.logo} href="/">
          <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true">
            <path d="M11 0 22 5 11 10 0 5Z" fill="#FF4A1C" transform="rotate(-14 11 5)" />
            <path d="M5 8v4h10V8" fill="#FF4A1C" transform="rotate(-14 11 5)" />
          </svg>
          Knowva
        </Link>
        <div className={styles.navr}>
          <div className={open ? `${styles.links} ${styles.linksOpen}` : styles.links}>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className={styles.auth}>
            <Link className={styles.signIn} href="/login">
              Sign in
            </Link>
            <Link className={styles.signUp} href="/signup">
              Sign up
            </Link>
          </div>
          <svg className={styles.moon} width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 15A8 8 0 0 1 9 4a8 8 0 1 0 11 11Z" fill="#4A4766" />
          </svg>
          <button className={styles.burger} type="button" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            <i />
            <i />
            <i />
          </button>
        </div>
      </nav>

      <section className={styles.hero}>
        <KnowvaClouds size="hero" />
        <h1>
          Learn faster
          <br />
          Get better grades
        </h1>
        <p className={styles.sub}>
          A personal AI tutor that explains your lessons, turns notes into practice, and shows you what to revise next.
        </p>
        <Link className={styles.btn} href="/signup?next=/student/tutors/new">
          Create a Tutor
        </Link>
        <p className={styles.meta}>One tutor for every subject you take.</p>
      </section>

      <section className={styles.beat}>
        <div className={styles.bubble} style={{ left: "calc(50% - 150px)", top: 110 }} />
        <div className={styles.bubble} style={{ left: "calc(50% + 70px)", top: 40 }} />
        <svg width="200" height="160" viewBox="0 0 110 90" aria-hidden="true">
          <path d={BLOB} fill="#FF4A1C" />
          <ellipse cx="48" cy="40" rx="6" ry="9" fill="#fff" />
          <ellipse cx="62" cy="40" rx="6" ry="9" fill="#fff" />
          <circle cx="46" cy="43" r="3.5" />
          <circle cx="60" cy="43" r="3.5" />
        </svg>
        <p>Ask a question. Get a step-by-step explanation.</p>
      </section>

      <div className={styles.frame}>
        <div className={styles.bar}>
          <b style={{ background: "#2557D6" }} />
          <b style={{ background: "#E8673C" }} />
          <b style={{ background: "#F2B833" }} />
          <span>Knowva AI</span>
        </div>
        <div className={styles.pv}>
          <h2>
            Understand any question, <em>step by step</em>
          </h2>
          <div className={styles.chat}>
            <div className={`${styles.m} ${styles.me}`}>Why does the quadratic formula have ± in it?</div>
            <div className={`${styles.m} ${styles.ai}`}>
              <small>Maths tutor</small>
              A quadratic curve can cross the x-axis in two places. The ± gives you both: one answer adds the square root, the other subtracts it. Want to try one?
              <div className={styles.quiz}>
                <span>Solve x² − 5x + 6 = 0</span>
                <span>Show me a graph</span>
              </div>
            </div>
            <div className={styles.input}>
              <span>Ask your Biology tutor…</span>
              <i />
            </div>
          </div>
        </div>
      </div>

      <section className={styles.feats} id="features">
        <article className={styles.feat}>
          <div className={styles.n} style={{ background: "#FFE3D8", color: "#C7360F" }}>1</div>
          <div>
            <h3>A tutor that teaches, not just answers</h3>
            <p>It explains in small steps, checks you understood, and adjusts to your class level.</p>
          </div>
        </article>
        <article className={styles.feat}>
          <div className={styles.n} style={{ background: "#E6E3F7", color: "#2412B0" }}>2</div>
          <div>
            <h3>Notes in, study pack out</h3>
            <p>Upload class notes and get a summary, flashcards, and key terms in under a minute.</p>
          </div>
        </article>
        <article className={styles.feat}>
          <div className={styles.n} style={{ background: "#FDF3C4", color: "#7A5A00" }}>3</div>
          <div>
            <h3>Quizzes that find your gaps</h3>
            <p>Practise with instant feedback. Every wrong answer comes with the reason why.</p>
          </div>
        </article>
        <article className={styles.feat}>
          <div className={styles.n} style={{ background: "#E8E3D6", color: "#1C1B19" }}>4</div>
          <div>
            <h3>See what to revise next</h3>
            <p>Your dashboard tracks scores by topic and points to the weakest one first.</p>
          </div>
        </article>
      </section>

      <section className={styles.cta} id="pricing">
        <KnowvaClouds size="cta" />
        <h3>Your AI tutors are ready when you are.</h3>
        <p>Exam prep for school and beyond. Free to start, on your phone.</p>
        <Link className={styles.btn} href="/signup?next=/student">
          Start learning free
        </Link>
      </section>
    </div>
  );
}
