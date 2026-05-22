import React from "react";
import ShopArchiveWrapper from "./ShopArchiveWrapper";
import { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "Shop | The Moveee" },
  description: "Curated lifestyle goods from vetted African and diaspora makers — clothing, objects, and editions reviewed for craft, integrity, and lasting quality.",
};

export default async function ShopPage() {
  return <ShopArchiveWrapper />;
}
