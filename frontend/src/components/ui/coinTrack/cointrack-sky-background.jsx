export function CoinTrackSkyBackground() {
  return (
    <>
      {/* Pinned cloudy sky background layer for Cirrus UI ambiance */}
      <div
        aria-hidden
        className='fixed inset-0 pointer-events-none z-0'
        style={{
          backgroundImage: "url('/sky.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Soft warm ambient sun glow */}
      <div
        aria-hidden
        className='fixed -top-40 right-0 w-[600px] h-[600px] bg-amber-100/30 rounded-full blur-3xl pointer-events-none z-0'
      />
    </>
  );
}
