"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

interface RotatingTextProps {
  texts: string[];
  transition?: any;
  initial?: any;
  animate?: any;
  exit?: any;
  animatePresenceMode?: "wait" | "sync" | "popLayout";
  animatePresenceInitial?: boolean;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | "random" | number;
  loop?: boolean;
  auto?: boolean;
  splitBy?: "characters" | "words" | "lines" | string;
  onNext?: (index: number) => void;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
  [key: string]: any;
}

const RotatingText = forwardRef<any, RotatingTextProps>((props, ref) => {
  const {
    texts,
    transition = { type: "spring", damping: 25, stiffness: 300 },
    initial = { y: "100%", opacity: 0 },
    animate = { y: 0, opacity: 1 },
    exit = { y: "-120%", opacity: 0 },
    animatePresenceMode = "wait",
    animatePresenceInitial = false,
    rotationInterval = 2000,
    staggerDuration = 0,
    staggerFrom = "first",
    loop = true,
    auto = true,
    splitBy = "characters",
    onNext,
    mainClassName,
    splitLevelClassName,
    elementLevelClassName,
    ...rest
  } = props;

  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const textsRef = useRef<string[]>(texts);

  // Reset index and restart animation when texts array changes (language change)
  useEffect(() => {
    console.log("RotatingText: texts changed", texts);
    console.log("Previous texts:", textsRef.current);
    console.log("New texts:", texts);
    
    // Check if texts actually changed
    const textsChanged = textsRef.current.join(',') !== texts.join(',');
    
    if (textsChanged) {
      console.log("RotatingText: Resetting index due to texts change");
      setCurrentTextIndex(0);
      currentIndexRef.current = 0;
      textsRef.current = texts;
    }
  }, [texts]);

  // Force re-render when texts change to ensure proper animation restart
  useEffect(() => {
    if (texts && texts.length > 0) {
      // Force component to re-render with new texts
      setCurrentTextIndex(0);
      currentIndexRef.current = 0;
    }
  }, [texts.join(',')]);  // Join to detect array content changes

  const splitIntoCharacters = (text: string) => {
    if (typeof Intl !== "undefined" && 'Segmenter' in Intl) {
      const segmenter = new (Intl as any).Segmenter("en", { granularity: "grapheme" });
      return Array.from(segmenter.segment(text), (segment: any) => segment.segment);
    }
    return Array.from(text);
  };

  const elements = useMemo(() => {
    if (!texts || texts.length === 0 || currentTextIndex >= texts.length) {
      console.warn("RotatingText: Invalid texts or index", { texts, currentTextIndex });
      return [{ characters: [""], needsSpace: false }];
    }
    
    const currentText = texts[currentTextIndex] || "";
    console.log("RotatingText: rendering text", currentText);
    
    if (splitBy === "characters") {
      // Zwracamy każdy znak jako osobny element, spacje są normalnie renderowane
      return splitIntoCharacters(currentText).map((char: string) => ({
        characters: [char],
        needsSpace: false,
      }));
    }
    if (splitBy === "words") {
      return currentText.split(" ").map((word: string, i: number, arr: string[]) => ({
        characters: [word],
        needsSpace: i !== arr.length - 1,
      }));
    }
    if (splitBy === "lines") {
      return currentText.split("\n").map((line: string, i: number, arr: string[]) => ({
        characters: [line],
        needsSpace: i !== arr.length - 1,
      }));
    }
    if (splitBy === "none" || !splitBy) {
      return [{ characters: [currentText], needsSpace: false }];
    }
    return currentText.split(splitBy).map((part: string, i: number, arr: string[]) => ({
      characters: [part],
      needsSpace: i !== arr.length - 1,
    }));
  }, [texts, currentTextIndex, splitBy]);

  const getStaggerDelay = useCallback(
    (index: number, totalChars: number) => {
      const total = totalChars;
      if (staggerFrom === "first") return index * staggerDuration;
      if (staggerFrom === "last") return (total - 1 - index) * staggerDuration;
      if (staggerFrom === "center") {
        const center = Math.floor(total / 2);
        return Math.abs(center - index) * staggerDuration;
      }
      if (staggerFrom === "random") {
        const randomIndex = Math.floor(Math.random() * total);
        return Math.abs(randomIndex - index) * staggerDuration;
      }
      return Math.abs(staggerFrom - index) * staggerDuration;
    },
    [staggerFrom, staggerDuration]
  );

  const handleIndexChange = useCallback(
    (newIndex: number) => {
      setCurrentTextIndex(newIndex);
      currentIndexRef.current = newIndex;
      if (onNext) onNext(newIndex);
    },
    [onNext]
  );

  const next = useCallback(() => {
    const nextIndex =
      currentTextIndex === texts.length - 1
        ? loop
          ? 0
          : currentTextIndex
        : currentTextIndex + 1;
    if (nextIndex !== currentTextIndex) {
      handleIndexChange(nextIndex);
    }
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const previous = useCallback(() => {
    const prevIndex =
      currentTextIndex === 0
        ? loop
          ? texts.length - 1
          : currentTextIndex
        : currentTextIndex - 1;
    if (prevIndex !== currentTextIndex) {
      handleIndexChange(prevIndex);
    }
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const jumpTo = useCallback(
    (index: number) => {
      const validIndex = Math.max(0, Math.min(index, texts.length - 1));
      if (validIndex !== currentTextIndex) {
        handleIndexChange(validIndex);
      }
    },
    [texts.length, currentTextIndex, handleIndexChange]
  );

  const reset = useCallback(() => {
    if (currentTextIndex !== 0) {
      handleIndexChange(0);
    }
  }, [currentTextIndex, handleIndexChange]);

  useImperativeHandle(
    ref,
    () => ({
      next,
      previous,
      jumpTo,
      reset,
    }),
    [next, previous, jumpTo, reset]
  );

  useEffect(() => {
    if (!auto) return;
    const intervalId = setInterval(() => {
      const currentIndex = currentIndexRef.current;
      const nextIndex =
        currentIndex === texts.length - 1
          ? loop
            ? 0
            : currentIndex
          : currentIndex + 1;
      if (nextIndex !== currentIndex) {
        handleIndexChange(nextIndex);
      }
    }, rotationInterval);
    return () => clearInterval(intervalId);
  }, [texts.length, loop, handleIndexChange, rotationInterval, auto]);

  return (
    <motion.span
      className={cn("text-rotate", mainClassName)}
      {...rest}
      layout
      transition={transition}
    >
      <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
        {splitBy === "none" || !splitBy ? (
          <motion.span
            key={currentTextIndex}
            className={cn("text-rotate")}
            layout
            initial={initial}
            animate={animate}
            exit={exit}
            transition={transition}
          >
            {texts[currentTextIndex]}
          </motion.span>
        ) : (
          <motion.span
            key={currentTextIndex}
            className={cn(
              splitBy === "lines" ? "text-rotate-lines" : "text-rotate"
            )}
            layout
          >
            {elements.map((wordObj: any, wordIndex: number, array: any[]) => {
              const previousCharsCount = array
                .slice(0, wordIndex)
                .reduce((sum: number, word: any) => sum + word.characters.length, 0);
              return (
                <span
                  key={wordIndex}
                  className={cn("text-rotate-word", splitLevelClassName)}
                >
                  {wordObj.characters.map((char: string, charIndex: number) => (
                    <motion.span
                      key={charIndex}
                      initial={initial}
                      animate={animate}
                      exit={exit}
                      transition={{
                        ...transition,
                        delay: getStaggerDelay(
                          previousCharsCount + charIndex,
                          array.reduce(
                            (sum: number, word: any) => sum + word.characters.length,
                            0
                          )
                        ),
                      }}
                      className={cn("text-rotate-element", elementLevelClassName)}
                    >
                      {char}
                    </motion.span>
                  ))}
                  {wordObj.needsSpace && " "}
                </span>
              );
            })}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.span>
  );
});

RotatingText.displayName = "RotatingText";

export default RotatingText; 