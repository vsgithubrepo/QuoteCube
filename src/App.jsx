/**
 * App.jsx — Root component
 * Controls auth state.
 * Logged out → landing page with login form
 * Logged in  → full platform including pricing
 */
import { useState } from 'react';
import Navbar          from './components/layout/Navbar';
import Footer          from './components/layout/Footer';
import Hero            from './components/sections/Hero';
import FeaturesSection from './components/sections/FeaturesSection';
import ClientsSection  from './components/sections/ClientsSection';
import PricingSection  from './components/sections/PricingSection';
import Carousel        from './components/sections/Carousel';

export default function App() {
  const [user, setUser] = useState(null);

  const handleSignIn  = () => setUser({ name: 'Vikas Sinha', email: 'vikas@etechcube.com' });
  const handleSignOut = () => setUser(null);

  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>

      <Navbar user={user} onSignIn={handleSignIn} onSignOut={handleSignOut} />

      <main id="main" style={{minHeight: '100vh'}}>
        <Hero onSignIn={handleSignIn} />
        <FeaturesSection />
        <ClientsSection />
        <Carousel />
        <PricingSection isAuthenticated={!!user} onSignIn={handleSignIn} />
      </main>

      <Footer />
    </>
  );
}
