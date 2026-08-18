export function WallBackdrop({ pinned = false }: { pinned?: boolean }) {
  return (
    <>
      <div
        className={`gallery-wall pointer-events-none ${pinned ? "gallery-wall--pinned" : "absolute inset-0"}`}
        aria-hidden="true"
      />
      <div
        className={`gallery-doodles ${pinned ? "gallery-doodles--pinned" : ""}`}
        aria-hidden="true"
      >
        <span className="gallery-doodle gallery-doodle--a">✦</span>
        <span className="gallery-doodle gallery-doodle--b">♡</span>
        <span className="gallery-doodle gallery-doodle--c">★</span>
        <span className="gallery-doodle gallery-doodle--d">✦</span>
        <span className="gallery-doodle gallery-doodle--e">♡</span>
      </div>
    </>
  );
}
