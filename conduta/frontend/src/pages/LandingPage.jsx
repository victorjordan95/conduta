// frontend/src/pages/LandingPage.jsx
import styles from './LandingPage.module.scss';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <HeroSection />
    </div>
  );
}
