
import logo from "../../icon/video_downloader_logo.svg";
const Header = () => {
  return (
    <header className="w-full sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-5xl mx-auto flex items-center justify-center gap-3 py-4 px-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-600">
          {/* <i className="ti ti-download text-white text-lg"></i> */}
          <img src={logo} alt="" />
        </div>
        <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
          All Video Downloader
        </h1>
      </div>
    </header>
  );
};

export default Header;