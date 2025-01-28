import { Remixer } from "@/components/ui/Remixer"

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-green-400 p-8 font-mono">
      {/* Terminal Header */}
      <div className="mx-auto mb-8" style={{ maxWidth: '1200px' }}>
        <div className="border border-green-500 rounded-t-md p-2 bg-black/50 flex items-center">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1 text-center text-sm">PROJECT_ADVISOR_v1.0</div>
        </div>
        
        {/* Terminal Content */}
        <div className="border-x border-b border-green-500 rounded-b-md bg-black/90 backdrop-blur-sm">
          <div className="p-4">
            <div className="mb-4 flex items-center">
              <span className="text-green-500"></span>
              <span className="ml-2 animate-pulse">_</span>
            </div>
            
            {/* Remixer Component */}
            <Remixer />
          </div>
        </div>
        
        {/* Terminal Footer */}
        <div className="mt-4 text-xs text-green-500/60 text-center">
          © 2024 Project Advisor Terminal • All rights reserved
        </div>
      </div>
    </div>
  )
}
