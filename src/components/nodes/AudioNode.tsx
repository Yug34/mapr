import type { NodeProps } from "@xyflow/react";
import type { AudioNodeData } from "../../types/common";
import { HandlesArray } from "../../utils/components";

export function AudioNode(props: NodeProps) {
  const { data, id } = props;
  const nodeData = data as AudioNodeData;
  return (
    <div className="flex flex-col items-center justify-center">
      <audio src={nodeData.audioBlobUrl} controls />
      <HandlesArray nodeId={id} />
    </div>
  );
}
