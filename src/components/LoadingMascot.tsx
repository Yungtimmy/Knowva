import { Mascot } from "@/components/Mascot";

/** The clouds bob in place while a page waits on its data. */
export function LoadingMascot() {
  return (
    <div className="kn-loading" role="status" aria-live="polite">
      <div className="kn-loading-clouds" aria-hidden="true">
        <Mascot variant="blue" className="kn-loading-cloud c1" />
        <Mascot variant="orange" className="kn-loading-cloud c2" />
        <Mascot variant="yellow" className="kn-loading-cloud c3" />
      </div>
      <span className="kn-sr-only">Loading</span>
    </div>
  );
}
