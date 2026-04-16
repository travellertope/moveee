import React from "react";
import ShopArchiveWrapper from "./ShopArchiveWrapper";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop · The Moveee",
  description: "Curated lifestyle goods from vetted makers.",
};

export default async function ShopPage() {
  return <ShopArchiveWrapper />;
}
