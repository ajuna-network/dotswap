import React, { useEffect, useState, useRef, FC } from "react";
import DownArrow from "../../../assets/img/down-arrow.svg?react";
import classNames from "classnames";

type AccordionListProps = {
  title?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  alwaysOpen?: boolean;
  defaultOpen?: boolean;
  nested?: boolean;
};

const AccordionList: FC<AccordionListProps> = ({
  title,
  className = "rounded-2xl",
  children,
  alwaysOpen = false,
  defaultOpen = false,
  nested = false,
}) => {
  const accordionElm = useRef<HTMLDivElement>(null);
  const titleElm = useRef<HTMLDivElement>(null);
  const itemsElm = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(defaultOpen || alwaysOpen);
  const [accordionHeight, setAccordionHeight] = useState({ titleElmHeight: 0, itemsElmHeight: 0 });

  const toggleAccordionList = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const isEnterKey = e.key === "Enter";
    const isArrowKey = e.key === "ArrowDown" || e.key === "ArrowUp";

    if ((isEnterKey || isArrowKey) && children && !alwaysOpen && !(e.target instanceof HTMLButtonElement)) {
      toggleAccordionList();
    }
  };

  const conditionalAttributes = alwaysOpen
    ? {}
    : {
        onClick: toggleAccordionList,
        onKeyDown: handleKeyDown,
        role: "button",
        tabIndex: 0,
      };

  useEffect(() => {
    setAccordionHeight({
      titleElmHeight: titleElm.current?.clientHeight || 0,
      itemsElmHeight: itemsElm.current?.scrollHeight || 0,
    });
  }, [isOpen, titleElm, itemsElm]);

  return (
    <div>
      <div
        ref={accordionElm}
        className={`flex w-full flex-col overflow-hidden transition-all duration-300 ease-in-out ${className}`}
        data-height={
          isOpen ? accordionHeight.titleElmHeight + accordionHeight.itemsElmHeight : accordionHeight.titleElmHeight
        }
        style={{
          height: alwaysOpen
            ? "100%"
            : isOpen
              ? nested
                ? "100%"
                : accordionHeight.itemsElmHeight + accordionHeight.titleElmHeight
              : title
                ? accordionHeight.titleElmHeight
                : accordionHeight.itemsElmHeight,
        }}
      >
        {title && (
          <div
            ref={titleElm}
            className="flex w-full flex-row justify-between p-8"
            data-height={accordionHeight.titleElmHeight}
            {...conditionalAttributes}
          >
            <div className="font-unbounded-variable text-heading-6 font-normal dedswap:font-omnes-bold dedswap:text-4xl">
              {title}
            </div>
            {!alwaysOpen && children && (
              <div
                className={classNames("flex items-center justify-center transition-all duration-300 ease-in-out", {
                  "rotate-180 transform opacity-100": isOpen,
                  "opacity-40": !isOpen,
                })}
              >
                <DownArrow />
              </div>
            )}
          </div>
        )}
        {children && (
          <div
            ref={itemsElm}
            className={classNames("flex w-full flex-col overflow-hidden transition-all duration-300 ease-in-out ", {
              "px-8 pb-8": !nested,
              "px-0": nested,
            })}
            data-height={accordionHeight.itemsElmHeight}
            style={{ height: isOpen || !title ? "100%" : 0 }}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccordionList;
