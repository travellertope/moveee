import React from "react";
import { DropCap, PullQuote, EditorialGallery } from "./Editorial";

interface BlockProps {
  fieldGroupName: string;
  [key: string]: any;
}

const ComponentMapper = ({ blocks }: { blocks: BlockProps[] }) => {
  if (!blocks) return null;

  return (
    <>
      {blocks.map((block, index) => {
        switch (block.fieldGroupName) {
          case "Post_Flexiblecontent_ContentBlocks_DropCap":
            return <DropCap key={index}>{block.text}</DropCap>;
          
          case "Post_Flexiblecontent_ContentBlocks_PullQuote":
            return <PullQuote key={index} quote={block.quote} author={block.author} />;
          
          case "Post_Flexiblecontent_ContentBlocks_Gallery":
            return <EditorialGallery key={index} images={block.images} />;
          
          default:
            console.warn(`No component found for block type: ${block.fieldGroupName}`);
            return null;
        }
      })}
    </>
  );
};

export default ComponentMapper;
