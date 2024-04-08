import { useEffect, useState } from "react";

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    return true;
  }

  useEffect(() => {
    checkScreenWidth();
    window.addEventListener("resize", checkScreenWidth);

    return () => {
      window.removeEventListener("resize", checkScreenWidth);
    };
  }, []);

  const checkScreenWidth = () => {
    setIsMobile(window.innerWidth <= 1024);
  };

  return isMobile;
};
