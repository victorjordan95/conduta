import styles from './LandingPage.module.scss';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import DorSection from '../components/landing/DorSection';
import DemoSection from '../components/landing/DemoSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import ProvaSection from '../components/landing/ProvaSection';
import PrecosSection from '../components/landing/PrecosSection';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <HeroSection />
      <DorSection />
      <DemoSection />
      <FeaturesSection />
      <ProvaSection />
      <PrecosSection />
    </div>
  );
}
