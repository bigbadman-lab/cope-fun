import Image from "next/image";

const MEDIA_WRAPPER_CLASS = "mb-8 aspect-[2/1] w-24 sm:w-28 md:w-32";

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
