type ParseErrorBannerProps = {
  readonly message: string;
};

const ParseErrorBanner = ({ message }: ParseErrorBannerProps) => (
  <div className="pointer-events-none absolute inset-0 flex items-end justify-start p-4">
    <div className="pointer-events-auto max-w-md rounded-md border border-yellow-500/60 bg-slate-900/90 px-4 py-3 text-xs text-yellow-300">
      {message}
    </div>
  </div>
);

export default ParseErrorBanner;
