import { Position } from "@xyflow/react";
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
import { CustomHandle } from "../../utils/components";

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
      <CustomHandle type="source" position={Position.Top} id="top" />
      <CustomHandle type="target" position={Position.Top} id="top-target" />
      <CustomHandle type="source" position={Position.Bottom} id="bottom" />
      <CustomHandle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
      />
      <CustomHandle type="source" position={Position.Left} id="left" />
      <CustomHandle type="target" position={Position.Left} id="left-target" />
      <CustomHandle type="source" position={Position.Right} id="right" />
      <CustomHandle type="target" position={Position.Right} id="right-target" />
    </div>
  );
}
