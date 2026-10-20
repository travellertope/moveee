"use client";

import { useRouter } from "next/navigation";
import StoopDetailPanel from "@/components/connect/StoopDetailPanel";

interface Props {
  clusterId: number;
}

export default function StoopPageContent({ clusterId }: Props) {
  const router = useRouter();
  return (
    <StoopDetailPanel
      clusterId={clusterId}
      onBack={() => router.push("/stoop")}
    />
  );
}
