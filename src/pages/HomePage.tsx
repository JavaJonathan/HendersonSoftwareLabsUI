import { NavBar } from '../components/layout/NavBar';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/landing/Hero';
import { WhatWeDo } from '../components/landing/WhatWeDo';
import { HowItWorks } from '../components/landing/HowItWorks';
import { CtaBanner } from '../components/landing/CtaBanner';
import { ScrollProgressBar } from '../components/motion/ScrollProgressBar';

export function HomePage() {
  return (
    <>
      <ScrollProgressBar />
      <NavBar />
      <Hero />
      <WhatWeDo />
      <HowItWorks />
      <CtaBanner />
      <Footer />
    </>
  );
}
