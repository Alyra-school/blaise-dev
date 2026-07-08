'use client';
import { useConnection } from "wagmi";
import Bank from "@/components/shared/Bank";
import NotConnected from "@/components/shared/NotConnected";

export default function Home() {

  const { isConnected } = useConnection();

  return (
    <div>
      {isConnected ? (
        <Bank />
      ) : (
        <NotConnected />
      )}
    </div>
  );
}
