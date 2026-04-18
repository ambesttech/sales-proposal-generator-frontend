import { GenerationProgress } from "./generation-progress";
import { InputSidebar } from "./input-sidebar";
import { ProposalActionToolbar } from "./proposal-action-toolbar";
import { ProposalCanvas } from "./proposal-canvas";

/**
 * Shell layout: narrow intake rail + primary document canvas.
 * Keeps page.tsx thin and preserves a single place to evolve responsive behavior.
 */
export function ProposalWorkspace() {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col md:h-[100dvh] md:overflow-hidden">
      <ProposalActionToolbar />
      <GenerationProgress />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row md:overflow-hidden">
        <div className="flex min-h-0 w-full shrink-0 md:h-full md:w-[380px]">
          <InputSidebar />
        </div>
        <ProposalCanvas />
      </div>
    </div>
  );
}