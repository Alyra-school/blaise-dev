'use client';
import { useConnection } from "wagmi";

import SimpleStorage from "@/components/shared/SimpleStorage";
import NotConnected from "@/components/shared/NotConnected";

export default function Home() {

  const { isConnected } = useConnection();

  return (
    <div className="p-5">
      {isConnected ? (
        <SimpleStorage />
      ) : (
        <NotConnected />
      )}
    </div>
  );
}
