import { Handle, Position } from "@xyflow/react";

export function WebPageNode() {
  return (
    <div className="text-updater-node">
      <div>
        <div>Web Page</div>
      </div>
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
