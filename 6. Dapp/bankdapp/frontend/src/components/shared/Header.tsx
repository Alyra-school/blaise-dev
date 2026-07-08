import ConnectButton from "./ConnectButton"
import { Landmark } from "lucide-react"

const Header = () => {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
            <Landmark className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">DeFi Bank</span>
        </div>
        <ConnectButton />
      </div>
    </header>
  )
}

export default Header
