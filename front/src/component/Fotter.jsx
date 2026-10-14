const Footer = () => {
  return (
    <footer className="w-full bg-slate-900 text-white py-6 px-6 border-t border-slate-800">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
        <p className="text-sm sm:text-base font-medium text-slate-300 tracking-wide">
          Created by{" "}
          <span className="font-semibold text-red-400 hover:text-red-300 transition-colors duration-300 cursor-pointer">
            Debabrata Paul
          </span>
        </p>

        <span className="hidden sm:block text-slate-600">•</span>

        <p className="flex items-center gap-1.5 text-sm sm:text-base text-slate-300">
          Made with
          {/* <i className="ti ti-heart-filled text-red-500 text-base"></i> */}
          ❤️
          for you
        </p>
      </div>

      <p className="text-center text-xs text-slate-500 mt-3">
        © {new Date().getFullYear()} All Video Downloader. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;