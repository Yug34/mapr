import { useCallback } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { TextUpdaterNodeData } from "../../types/common";

export function TextUpdaterNode(props: NodeProps) {
  const { data } = props;
  const nodeData = data as TextUpdaterNodeData;
  const onChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    console.log(evt.target.value);
  }, []);

  return (
    <div>
      <div>
        <label htmlFor="text">Text: </label>
        <input
          id="text"
          name="text"
          onChange={onChange}
          value={nodeData.label}
        />
      </div>
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
