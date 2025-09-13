import { Handle, Position } from "@xyflow/react";
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

export function VideoNode(props: NodeProps) {
  const { data } = props;
  const nodeData = data as VideoNodeData;
  return (
    <div className="flex flex-col items-center justify-center">
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
    </div>
  );
}
