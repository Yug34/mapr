import type {
  AudioNodeData,
  CustomNode,
  VideoNodeData,
  ImageNodeData,
  PDFNodeData,
  TODONodeData,
  LinkNodeData,
} from "../types/common";

import skyscraperImage from "/skyscraper.png?url";
import haloOST from "/Halo OST.mp3?url";
import comfortablyNumb from "/Comfortably Numb.mp4?url";
import metamorphosis from "/Metamorphosis.pdf?url";

export const initialNodes: CustomNode[] = [
  {
    id: "n1",
    position: { x: -120, y: -170 },
    type: "NoteNode",
    data: {
      title: "About mapr",
      content: `I used to use a mind map app called [**Edvo**](https://www.linkedin.com/company/edvo).\n\n
Unfortunately, they shut down :(\n\n
So I made this for myself :D\n\n
You can add nodes for text, images, videos, audio, PDFs, and make TODOs.
**Source code on GitHub**: [mapr](https://github.com/yug34/mapr).`,
    },
  },
  {
    id: "n2",
    position: { x: 250, y: 180 },
    type: "NoteNode",
    data: {
      title: "'lil Tutorial",
      content: `- Right click on the canvas to add new nodes.
- Click and drag to move the nodes.
- Right click on a node to **duplicate** or **delete** it.
- Connect edges by clicking and dragging your cursor from a handle to another handle.
- Pan around the canvas using Figma-like controls.`,
    },
  },
  {
    id: "n3",
    type: "ImageNode",
    position: { x: 450, y: 550 },
    data: {
      fileName: "skyscraper.png",
      title: "Skyscraper",
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
    position: { x: -600, y: 600 },
    data: {
      fileName: "Halo OST.mp3",
      title: "Halo OST",
      audioBlobUrl: haloOST,
      audio: haloOST as unknown as File,
      audioBase64: "",
      mediaId: "halo-ost",
    } as AudioNodeData,
  },
  {
    id: "n6",
    type: "VideoNode",
    position: { x: -125, y: 570 },
    data: {
      fileName: "Comfortably Numb.mp4",
      title: "Comfortably Numb",
      videoBlobUrl: comfortablyNumb,
      video: comfortablyNumb as unknown as File,
      videoBase64: "",
      mediaId: "comfortably-numb",
    } as VideoNodeData,
  },
  {
    id: "n7",
    type: "PDFNode",
    position: { x: -650, y: -150 },
    data: {
      fileName: "Metamorphosis.pdf",
      title: "Metamorphosis",
      pdfBlobUrl: metamorphosis,
      pdf: metamorphosis as unknown as File,
      pdfBase64: "",
      mediaId: "metamorphosis",
    } as PDFNodeData,
  },
  {
    id: "n8",
    type: "LinkNode",
    position: { x: 520, y: 50 },
    data: {
      url: "https://www.linkedin.com/in/yug34",
    } as LinkNodeData,
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
    id: "n2-n6",
    target: "n6",
    source: "n2",
    sourceHandle: "bottom",
    targetHandle: "top-target",
  },
  {
    id: "n4-n6",
    target: "n6",
    source: "n4",
    sourceHandle: "bottom",
    targetHandle: "top-target",
  },
  {
    id: "n5-n6",
    target: "n6",
    source: "n5",
    sourceHandle: "right",
    targetHandle: "left-target",
  },
  {
    id: "n6-n3",
    target: "n3",
    source: "n6",
    sourceHandle: "right",
    targetHandle: "left-target",
  },
  {
    id: "n1-n7",
    target: "n7",
    source: "n1",
    sourceHandle: "left",
    targetHandle: "right-target",
  },
  {
    id: "n1-n8",
    target: "n8",
    source: "n1",
    sourceHandle: "right",
    targetHandle: "left-target",
  },
];
