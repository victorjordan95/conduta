import styles from './LandingPage.module.scss';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import DorSection from '../components/landing/DorSection';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <HeroSection />
      <DorSection />
    </div>
  );
}
