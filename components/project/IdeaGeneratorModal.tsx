'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, Check } from "lucide-react";
import { BrutalButton } from "@/components/ui/brutal-button";
import { cn } from "@/lib/utils";
import { isPredominantlyHebrew } from "@/lib/hebrew-utils";

interface IdeaGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  victimName: string;
  onSelectSuggestions: (quotes: string[]) => void;
}

export function IdeaGeneratorModal({
  isOpen,
  onClose,
  victimName,
  onSelectSuggestions,
}: IdeaGeneratorModalProps) {
  const [traits, setTraits] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle VisualViewport API for keyboard detection
  useEffect(() => {
    if (!isOpen) return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      // Calculate keyboard height from viewport difference
      const heightDiff = window.innerHeight - viewport.height;
      setKeyboardHeight(heightDiff > 50 ? heightDiff : 0);
    };

    viewport.addEventListener("resize", handleResize);
    viewport.addEventListener("scroll", handleResize);
    handleResize();

    return () => {
      viewport.removeEventListener("resize", handleResize);
      viewport.removeEventListener("scroll", handleResize);
    };
  }, [isOpen]);

  // Scroll textarea into view when focused
  const handleTextareaFocus = useCallback(() => {
    // Small delay to let keyboard animate open
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 300);
  }, []);

  const handleGenerate = async () => {
    const victim_name = String(victimName ?? "").trim();
    const true_traits = traits.trim();

    console.log("[IdeaGenerator] victim_name:", victim_name);
    console.log("[IdeaGenerator] true_traits:", true_traits);

    if (!victim_name || !true_traits) {
      console.error("[IdeaGenerator] Validation failed", { victim_name, true_traits });
      setSuggestions([]);
      setError("Couldn't generate ideas. Please try again or write your own!");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    setSelectedIndices(new Set());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const payload = {
      victimName: victim_name,
      trueTraits: true_traits
    };

    console.log("[IdeaGenerator] Calling /api/generate-quotes");
    console.log("[IdeaGenerator] Payload:", JSON.stringify(payload, null, 2));

    try {
      const response = await fetch("/api/generate-quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("[IdeaGenerator] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[IdeaGenerator] Error response:", errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("[IdeaGenerator] Response data:", JSON.stringify(data, null, 2));

      if (data.success && Array.isArray(data.quotes)) {
        setSuggestions(data.quotes);
      } else {
        console.error("[IdeaGenerator] Invalid response format:", data);
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("[IdeaGenerator] Full error:", err);
      setError("Couldn't generate ideas. Please try again or write your own!");
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const toggleSelection = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleBulkAdd = () => {
    const selectedQuotes = suggestions.filter((_, i) => selectedIndices.has(i));
    if (selectedQuotes.length > 0) {
      onSelectSuggestions(selectedQuotes);
    }
    handleClose();
  };

  const handleClose = () => {
    setTraits("");
    setSuggestions([]);
    setSelectedIndices(new Set());
    setError(null);
    onClose();
  };

  const selectedCount = selectedIndices.size;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-foreground/50 backdrop-blur-sm"
          style={{
            // Adjust for keyboard by reducing visible area
            height: keyboardHeight > 0 ? `calc(100% - ${keyboardHeight}px)` : "100%",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "w-full sm:max-w-md bg-background border-t-3 sm:border-3 border-foreground sm:rounded-xl shadow-brutal",
              "flex flex-col",
              // Reduce max-height when keyboard is open
              keyboardHeight > 0 ? "max-h-[100%]" : "max-h-[85dvh] sm:max-h-[80vh]"
            )}
          >
            {/* Header - Fixed */}
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-foreground shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-heading font-bold text-base">Roast Assistant</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div ref={contentRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {suggestions.length === 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Tell us 3 things{" "}
                    <span className="font-semibold text-foreground">{victimName}</span>{" "}
                    actually LOVES or does all the time, and we'll turn them into
                    hilarious opposite quotes.
                  </p>

                  <textarea
                    ref={textareaRef}
                    value={traits}
                    onChange={(e) => setTraits(e.target.value)}
                    onFocus={handleTextareaFocus}
                    placeholder="Example: Loves crossfit, wakes up early, eats vegan food"
                    className="w-full min-h-[100px] p-3 rounded-lg border-2 border-foreground bg-muted/30 font-medium text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/60"
                    dir={isPredominantlyHebrew(traits) ? 'rtl' : 'ltr'}
                    style={{
                      textAlign: isPredominantlyHebrew(traits) ? 'right' : 'left',
                    }}
                    autoFocus
                    maxLength={500}
                  />

                  {error && (
                    <p className="text-sm text-destructive font-medium text-center py-2">
                      {error}
                    </p>
                  )}

                  <BrutalButton
                    onClick={handleGenerate}
                    disabled={!traits.trim() || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Roasts
                      </>
                    )}
                  </BrutalButton>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground text-center">
                    Tap to select roasts for{" "}
                    <span className="font-semibold text-foreground">{victimName}</span>:
                  </p>

                  <div className="space-y-2">
                    {suggestions.map((suggestion, index) => {
                      const isSelected = selectedIndices.has(index);
                      const isHebrewSuggestion = isPredominantlyHebrew(suggestion);
                      return (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => toggleSelection(index)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border-2 transition-all",
                            "flex items-start gap-3 group",
                            isSelected
                              ? "border-primary bg-primary/20"
                              : "border-foreground bg-background hover:bg-muted/50"
                          )}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors",
                              isSelected
                                ? "border-primary bg-primary"
                                : "border-muted-foreground"
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <span
                            className="flex-1 text-sm font-medium leading-relaxed"
                            dir={isHebrewSuggestion ? 'rtl' : 'ltr'}
                            style={{
                              textAlign: isHebrewSuggestion ? 'right' : 'left',
                            }}
                          >
                            "{suggestion}"
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      setSuggestions([]);
                      setSelectedIndices(new Set());
                      setTraits("");
                    }}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    ← Try different traits
                  </button>
                </>
              )}
            </div>

            {/* Sticky Footer - Only when suggestions exist */}
            {suggestions.length > 0 && (
              <div className="shrink-0 p-4 border-t-2 border-foreground bg-background">
                <BrutalButton
                  onClick={handleBulkAdd}
                  disabled={selectedCount === 0}
                  className="w-full"
                >
                  {selectedCount === 0
                    ? "Select roasts to add"
                    : `Add ${selectedCount} Roast${selectedCount !== 1 ? "s" : ""}`}
                </BrutalButton>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
