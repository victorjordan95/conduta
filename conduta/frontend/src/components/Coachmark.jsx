import { useState, useEffect, useCallback } from 'react';
import { markCoachmarks } from '../services/api';
import styles from './Coachmark.module.scss';

const PADDING = 8;

export default function Coachmark({ type, steps, onDone }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);

  const currentStep = steps[stepIndex];

  const updateRect = useCallback(() => {
    const el = document.querySelector(`[data-coachmark="${currentStep.target}"]`);
    if (el) setRect(el.getBoundingClientRect());
  }, [currentStep.target]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [updateRect]);

  async function handleDone() {
    try { await markCoachmarks(type); } catch {}
    onDone();
  }

  function handleNext() {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      handleDone();
    }
  }

  if (!rect) return null;

  const spotlightStyle = {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  };

  // Posiciona tooltip abaixo do spotlight; se não couber, posiciona acima
  const viewportHeight = window.innerHeight;
  const tooltipTop = rect.bottom + PADDING + 12;
  const fitsBelow = tooltipTop + 160 < viewportHeight;
  const tooltipStyle = fitsBelow
    ? { top: tooltipTop, left: Math.max(8, rect.left) }
    : { bottom: viewportHeight - rect.top + PADDING + 12, left: Math.max(8, rect.left) };

  return (
    <>
      <div className={styles.overlay} />
      <div className={styles.spotlight} style={spotlightStyle} />
      <div className={styles.tooltip} style={tooltipStyle}>
        <p className={styles.tooltipTitle}>{currentStep.title}</p>
        <p className={styles.tooltipText}>{currentStep.text}</p>
        <div className={styles.tooltipActions}>
          <span className={styles.stepIndicator}>{stepIndex + 1} / {steps.length}</span>
          <button className={styles.btnSkip} onClick={handleDone}>Pular</button>
          <button className={styles.btnNext} onClick={handleNext}>
            {stepIndex < steps.length - 1 ? 'Próximo →' : 'Concluir'}
          </button>
        </div>
      </div>
    </>
  );
}
