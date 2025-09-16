import type { AudioNodeData, CustomNode } from "../types/common";
import skyscraperImage from "/skyscraper.png?url";
import haloOST from "/Halo OST.mp3?url";
import type { ImageNodeData } from "../types/common";
import type { TODONodeData } from "../types/common";

export const initialNodes: CustomNode[] = [
  {
    id: "n1",
    position: { x: 0, y: 0 },
    type: "NoteNode",
    data: {
      title: "About mapr",
      content: `I used to use a mind map app called [**Edvo**](https://www.linkedin.com/company/edvo).\n\n
Unfortunately, they shut down :(\n\n
So I made this for myself :D\n\n
**Source code on GitHub**: [mapr](https://github.com/yug34/mapr).`,
    },
  },
  {
    id: "n2",
    position: { x: 250, y: 250 },
    type: "NoteNode",
    data: {
      title: "'lil Tutorial",
      content: `- Right click on the canvas to add new nodes.
- Click and drag to move the nodes.
- Right click on a node/edge to duplicate/delete.
- Connect edges from a handle to another handle.`,
    },
  },
  {
    id: "n3",
    type: "ImageNode",
    position: { x: -75, y: 500 },
    data: {
      fileName: "skyscraper.png",
      imageBlobUrl: skyscraperImage,
      image: undefined as unknown as File,
      imageBase64: "",
      mediaId: "skyscraper-image",
    } as ImageNodeData,
  },
  {
    id: "n4",
    type: "TODONode",
    position: { x: -250, y: 250 },
    data: {
      title: "Today's TODOs",
      todos: [
        { id: "t1", title: "Hydrate yourself", completed: false },
        { id: "t2", title: "Look pretty", completed: true },
        {
          id: "t3",
          title: "Crack a smile, it's a good day! 🌻",
          completed: false,
        },
      ],
    } as TODONodeData,
  },
  {
    id: "n5",
    type: "AudioNode",
    position: { x: -250, y: 500 },
    data: {
      fileName: "Halo OST.mp3",
      audioBlobUrl: haloOST,
      audio: haloOST as unknown as File,
      audioBase64: "",
      mediaId: "halo-ost",
    } as AudioNodeData,
  },
];

export const initialEdges = [
  {
    id: "n1-n2",
    target: "n2",
    source: "n1",
    sourceHandle: "bottom",
    targetHandle: "top-target",
  },
  {
    id: "n1-n4",
    target: "n4",
    source: "n1",
    sourceHandle: "bottom",
    targetHandle: "top-target",
  },
  {
    id: "n2-n3",
    target: "n3",
    source: "n2",
    sourceHandle: "bottom",
    targetHandle: "top-target",
  },
  {
    id: "n4-n3",
    target: "n3",
    source: "n4",
    sourceHandle: "bottom",
    targetHandle: "top-target",
  },
];
