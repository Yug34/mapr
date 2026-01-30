import type { NodeProps } from "@xyflow/react";
import type { AudioNodeData } from "../../types/common";
import {
  AudioPlayer,
  AudioPlayerContent,
  AudioPlayerControlBar,
  AudioPlayerMuteButton,
  AudioPlayerPlayButton,
  AudioPlayerTimeDisplay,
  AudioPlayerTimeRange,
  AudioPlayerVolumeRange,
} from "@/components/ui/audio-player";
import { EditableNodeTitle } from "@/components/ui/editable-node-title";
import { HandlesArray } from "../../utils/components";
import { useCanvas } from "../../hooks/useCanvas";

export function AudioNode(props: NodeProps) {
  const { data, id } = props;
  const nodeData = data as AudioNodeData;
  const { updateNodeData } = useCanvas();
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-1 w-[360px] max-w-full rounded border bg-white px-2 py-1 text-center text-xs font-semibold">
        <EditableNodeTitle
          displayValue={nodeData.title ?? nodeData.fileName}
          onSave={(value) =>
            updateNodeData(id, {
              title: value || undefined,
            } as Partial<AudioNodeData>)
          }
          title={nodeData.fileName}
        />
      </div>
      <AudioPlayer className="drag-handle overflow-hidden rounded-lg border w-[360px] max-w-full h-[56px] min-h-[56px]">
        <AudioPlayerContent
          crossOrigin=""
          preload="auto"
          slot="media"
          src={nodeData.audioBlobUrl}
        />
        <AudioPlayerControlBar className="h-full">
          <AudioPlayerPlayButton />
          <AudioPlayerTimeRange />
          <AudioPlayerTimeDisplay showDuration />
          <AudioPlayerMuteButton />
          <AudioPlayerVolumeRange />
        </AudioPlayerControlBar>
      </AudioPlayer>
      <HandlesArray nodeId={id} />
    </div>
  );
}
