import Nav from "./landing/Nav";
import Hero from "./landing/Hero";
import Features from "./landing/Features";
import HowItWorks from "./landing/HowItWorks";
import FAQ from "./landing/FAQ";
import Footer from "./landing/Footer";

/**
 * Storra – Landing Page
 *
 * Self-contained React component. No routing setup or ReactDOM.render included.
 * Export this component and render it at the "/" route in your app.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white antialiased transition-colors">
      {/* Meta hint: set <title>Storra – Cloud Storage for Humans</title> in your HTML head */}
      <Nav />

      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
