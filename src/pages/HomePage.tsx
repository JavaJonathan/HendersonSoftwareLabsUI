import { NavBar } from '../components/layout/NavBar';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/landing/Hero';
import { CalculatorPromo } from '../components/landing/CalculatorPromo';
import { WhatWeDo } from '../components/landing/WhatWeDo';
import { TheLine } from '../components/landing/TheLine';
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
      <CalculatorPromo />
      <TheLine />
      <CtaBanner />
      <Footer />
    </>
  );
}
