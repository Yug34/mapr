import { Handle, Position } from "@xyflow/react";
import type { HandleProps } from "@xyflow/react";
import { useHandleConnections } from "./hooks";

interface CustomHandleProps extends HandleProps {
  nodeId?: string;
}

const CustomHandle = ({ nodeId, id, type, ...props }: CustomHandleProps) => {
  // Always call the hook, but only use the result if we have the required props
  const hasConnections = useHandleConnections(
    nodeId || "",
    id || "",
    type || "source"
  );

  const actualHasConnections = nodeId && id && type ? hasConnections : false;

  const handleStyle = {
    opacity: actualHasConnections ? 1 : 0.2,
  };

  return (
    <Handle
      id={id}
      type={type}
      {...props}
      style={{ ...props.style, ...handleStyle }}
    />
  );
};

export const HandlesArray = ({ nodeId }: { nodeId: string }) => {
  return (
    <>
      <CustomHandle
        type="source"
        position={Position.Top}
        id="top"
        nodeId={nodeId}
      />
      <CustomHandle
        type="target"
        position={Position.Top}
        id="top-target"
        nodeId={nodeId}
      />
      <CustomHandle
        type="source"
        position={Position.Bottom}
        id="bottom"
        nodeId={nodeId}
      />
      <CustomHandle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        nodeId={nodeId}
      />
      <CustomHandle
        type="source"
        position={Position.Left}
        id="left"
        nodeId={nodeId}
      />
      <CustomHandle
        type="target"
        position={Position.Left}
        id="left-target"
        nodeId={nodeId}
      />
      <CustomHandle
        type="source"
        position={Position.Right}
        id="right"
        nodeId={nodeId}
      />
      <CustomHandle
        type="target"
        position={Position.Right}
        id="right-target"
        nodeId={nodeId}
      />
    </>
  );
};
