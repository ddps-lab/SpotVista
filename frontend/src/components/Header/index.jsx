export default function Header() {
  return (
    <div className="h-24 w-full bg-yellow-300 shadow-md flex justify-center items-center flex-shrink-0">
      <div className="w-full max-w-screen-xl px-5 flex flex-col">
        <img
          src="/logo.svg"
          alt="SpotVista"
          className="w-64 md:w-90 select-none"
          draggable="false"
        />
      </div>
    </div>
  );
}
