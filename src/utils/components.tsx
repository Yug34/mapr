import { Handle } from "@xyflow/react";
import type { HandleProps } from "@xyflow/react";

export const CustomHandle = (props: HandleProps) => {
  return <Handle {...props} style={{ backgroundColor: "red" }} />;
};
