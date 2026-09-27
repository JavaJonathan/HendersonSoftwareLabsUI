import { NavBar } from '../components/layout/NavBar';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/landing/Hero';
import { CalculatorPromo } from '../components/landing/CalculatorPromo';
import { WhatWeDo } from '../components/landing/WhatWeDo';
import { TheLine } from '../components/landing/TheLine';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Faq } from '../components/landing/Faq';
import { CtaBanner } from '../components/landing/CtaBanner';
import { ScrollProgressBar } from '../components/motion/ScrollProgressBar';
import { WorkflowRecognition } from '../components/landing/WorkflowRecognition';
import { SecondaryOffers } from '../components/landing/SecondaryOffers';

export function HomePage() {
  return (
    <>
      <ScrollProgressBar />
      <NavBar />
      <Hero />
      <WorkflowRecognition />
      <WhatWeDo />
      <HowItWorks />
      <CalculatorPromo />
      <SecondaryOffers />
      <TheLine />
      <Faq />
      <CtaBanner />
      <Footer />
    </>
  );
}
