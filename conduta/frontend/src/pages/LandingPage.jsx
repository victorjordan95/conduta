import styles from './LandingPage.module.scss';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import DorSection from '../components/landing/DorSection';
import DemoSection from '../components/landing/DemoSection';
import FeaturesSection from '../components/landing/FeaturesSection';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <HeroSection />
      <DorSection />
      <DemoSection />
      <FeaturesSection />
    </div>
  );
}
