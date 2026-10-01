export default function StepIndicator({ current, total }) {
  return (
    <div className="step-indicator">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`dot ${i + 1 <= current ? 'active' : ''}`} />
      ))}
      <span className="step-label">Step {current} of {total}</span>
    </div>
  );
}