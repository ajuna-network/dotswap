import { useEffect, useState } from "react";

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isResponsive, setIsResponsive] = useState<boolean>(false);

  useEffect(() => {
    checkScreenWidth();
    window.addEventListener("resize", checkScreenWidth);

    return () => {
      window.removeEventListener("resize", checkScreenWidth);
    };
  }, []);

  const checkScreenWidth = () => {
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? setIsMobile(true) : setIsMobile(false);
    setIsResponsive(window.innerWidth <= 1024);
  };

  return {
    isMobile,
    isResponsive,
  };
};
