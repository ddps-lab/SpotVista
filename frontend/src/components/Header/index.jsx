export default function Header() {
  return (
    <div className="h-20 w-full bg-gradient-to-r from-amber-400 to-amber-500 shadow-lg flex justify-center items-center flex-shrink-0 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>
      <div className="w-full max-w-screen-xl px-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <img
            src="/logo.svg"
            alt="SpotVista"
            className="w-56 md:w-72 select-none filter drop-shadow-md hover:drop-shadow-lg transition-all duration-300"
            draggable="false"
          />
          <span className="hidden md:block text-white/90 text-sm font-medium tracking-wide">
            Availability-Aware Recommendation System for Reliable and Cost-Efficient
            Multi-Node Spot Instances
          </span>
        </div>
      </div>
    </div>
  );
}
