import Image from "next/image";

const MEDIA_WRAPPER_CLASS = "mb-8 aspect-[2/1] w-28 sm:w-32 md:w-36";

export function HeroMedia() {
  return (
    <div className={MEDIA_WRAPPER_CLASS}>
      <Image
        src="/copemainlight.png"
        alt=""
        width={150}
        height={75}
        className="h-full w-full object-contain"
        priority
      />
    </div>
  );
}
