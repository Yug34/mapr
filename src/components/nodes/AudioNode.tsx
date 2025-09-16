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
import { HandlesArray } from "../../utils/components";

export function AudioNode(props: NodeProps) {
  const { data, id } = props;
  const nodeData = data as AudioNodeData;
  return (
    <div className="flex flex-col items-center justify-center">
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
