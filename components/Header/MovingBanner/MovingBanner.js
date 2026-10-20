const MovingBanner = () => {
  const repeatedText = Array(10)
    .fill("ANTHROPOLOGY / DIGITAL HUMANITIES / DESIGN")
    .join("   /   ");

  return (
<div className="sticky w-full inset-x-0 top-0 bg-[#FFC1CF] dark:bg-black py-1 overflow-hidden border-b border-[#2B2118]">
  <div
    className="inline-block animate-scroll whitespace-nowrap text-lg font-semibold text-[#2B2118]"
    style={{ minWidth: "200%" }}
  >
    {repeatedText}
  </div>
</div>
  );
};

export default MovingBanner;
