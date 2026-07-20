import Image from "next/image";

const MEDIA_WRAPPER_CLASS = "aspect-[2/1] w-28 sm:w-32 md:w-36";

export function HeroMedia({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`${MEDIA_WRAPPER_CLASS} ${compact ? "mb-4" : "mb-8"}`}>
      <Image
        src="/hoodhome.png"
        alt=""
        width={1485}
        height={1485}
        className="h-full w-full object-contain"
        priority
      />
    </div>
  );
}
