import type { NodeProps } from "@xyflow/react";
import type { VideoNodeData } from "../../types/common";
import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
  VideoPlayerVolumeRange,
} from "@/components/ui/video-player";
import { HandlesArray } from "../../utils/components";

export function VideoNode(props: NodeProps) {
  const { data, id } = props;
  const nodeData = data as VideoNodeData;
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="mb-1 w-full text-xs text-center font-semibold truncate bg-white rounded border px-2 py-1"
        title={nodeData.fileName}
      >
        {nodeData.fileName}
      </div>
      <VideoPlayer className="overflow-hidden rounded-lg border">
        <VideoPlayerContent
          crossOrigin=""
          muted
          preload="auto"
          slot="media"
          src={nodeData.videoBlobUrl}
        />
        <VideoPlayerControlBar>
          <VideoPlayerPlayButton />
          <VideoPlayerSeekBackwardButton />
          <VideoPlayerSeekForwardButton />
          <VideoPlayerTimeRange />
          <VideoPlayerTimeDisplay showDuration />
          <VideoPlayerMuteButton />
          <VideoPlayerVolumeRange />
        </VideoPlayerControlBar>
      </VideoPlayer>
      <HandlesArray nodeId={id} />
    </div>
  );
}
