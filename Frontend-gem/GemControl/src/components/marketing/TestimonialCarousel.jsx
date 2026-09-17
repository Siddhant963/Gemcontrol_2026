import { useRef, useState, useEffect, useCallback } from "react";
import { Box, IconButton, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import TestimonialCard from "./TestimonialCard";
import SymbolIcon from "../SymbolIcon";

// Dependency-free horizontal carousel using native CSS scroll-snap, so it
// works with touch swipe on mobile for free and needs no animation library.
function TestimonialCarousel({ testimonials }) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));
  const visibleCount = isMdUp ? 3 : isSmUp ? 2 : 1;
  const trackRef = useRef(null);
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(testimonials.length / visibleCount);

  const scrollToPage = useCallback(
    (index) => {
      const clamped = Math.max(0, Math.min(index, pageCount - 1));
      const track = trackRef.current;
      if (!track) return;
      const cardWidth = track.scrollWidth / testimonials.length;
      track.scrollTo({ left: clamped * visibleCount * cardWidth, behavior: "smooth" });
      setPage(clamped);
    },
    [pageCount, testimonials.length, visibleCount]
  );

  useEffect(() => {
    setPage(0);
    trackRef.current?.scrollTo({ left: 0 });
  }, [visibleCount]);

  return (
    <Box>
      <Box sx={{ position: "relative" }}>
        <Box
          ref={trackRef}
          sx={{
            display: "flex",
            gap: 3,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollBehavior: "smooth",
            pb: 1,
            "&::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {testimonials.map((t) => (
            <Box
              key={t.id}
              sx={{
                flex: `0 0 calc(${100 / visibleCount}% - ${((visibleCount - 1) * 24) / visibleCount}px)`,
                scrollSnapAlign: "start",
              }}
            >
              <TestimonialCard testimonial={t} />
            </Box>
          ))}
        </Box>

        {pageCount > 1 && (
          <>
            <IconButton
              aria-label="Previous testimonials"
              onClick={() => scrollToPage(page - 1)}
              disabled={page === 0}
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                position: "absolute",
                left: -20,
                top: "40%",
                bgcolor: theme.palette.background.paper,
                boxShadow: theme.shadows[2],
                "&:hover": { bgcolor: theme.palette.surfaces.low },
              }}
            >
              <SymbolIcon name="chevron_left" />
            </IconButton>
            <IconButton
              aria-label="Next testimonials"
              onClick={() => scrollToPage(page + 1)}
              disabled={page === pageCount - 1}
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                position: "absolute",
                right: -20,
                top: "40%",
                bgcolor: theme.palette.background.paper,
                boxShadow: theme.shadows[2],
                "&:hover": { bgcolor: theme.palette.surfaces.low },
              }}
            >
              <SymbolIcon name="chevron_right" />
            </IconButton>
          </>
        )}
      </Box>

      {pageCount > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 2.5 }}>
          {Array.from({ length: pageCount }).map((_, i) => (
            <Box
              key={i}
              component="button"
              aria-label={`Go to testimonial page ${i + 1}`}
              onClick={() => scrollToPage(i)}
              sx={{
                width: i === page ? 20 : 8,
                height: 8,
                borderRadius: 9999,
                border: "none",
                cursor: "pointer",
                bgcolor: i === page ? theme.palette.tertiary.main : theme.palette.surfaces.high,
                transition: "width 0.2s ease, background-color 0.2s ease",
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default TestimonialCarousel;
