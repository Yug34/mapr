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
import { EditableNodeTitle } from "@/components/ui/editable-node-title";
import { HandlesArray } from "../../utils/components";
import { useCanvas } from "../../hooks/useCanvas";

export function VideoNode(props: NodeProps) {
  const { data, id } = props;
  const nodeData = data as VideoNodeData;
  const { updateNodeData } = useCanvas();
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-1 w-full rounded border bg-white px-2 py-1 text-center text-xs font-semibold">
        <EditableNodeTitle
          displayValue={nodeData.title ?? nodeData.fileName}
          onSave={(value) =>
            updateNodeData(id, {
              title: value || undefined,
            } as Partial<VideoNodeData>)
          }
          title={nodeData.fileName}
        />
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
