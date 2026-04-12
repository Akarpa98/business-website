(() => {
  const supportsObserver = "IntersectionObserver" in window;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const revealTargets = Array.from(
    document.querySelectorAll(".section-intro, .feature-card, .timeline-wrap, .value-card, .partner-card, .service-note")
  );
  const timeline = document.querySelector(".timeline-wrap");

  if (!prefersReducedMotion && supportsObserver) {
    revealTargets.forEach((element, index) => {
      element.classList.add("will-reveal");
      element.style.setProperty("--reveal-delay", `${(index % 3) * 70}ms`);
    });

    if (timeline) {
      timeline.classList.add("timeline-animated");
    }

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    revealTargets.forEach((element) => revealObserver.observe(element));
  }

  const navLinks = Array.from(document.querySelectorAll("header nav a[href^='#']"));
  const sectionTargets = navLinks
    .map((link) => {
      const id = link.getAttribute("href");
      const section = id ? document.querySelector(id) : null;
      return section ? { id: section.id, link, section } : null;
    })
    .filter(Boolean);

  if (sectionTargets.length === 0) {
    return;
  }

  const setActiveLink = (activeId) => {
    sectionTargets.forEach(({ id, link }) => {
      const isActive = id === activeId;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const targetId = link.getAttribute("href")?.replace("#", "");
      if (targetId) {
        setActiveLink(targetId);
      }
    });
  });

  if (!supportsObserver) {
    return;
  }

  const visibleSections = new Map();

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        if (entry.isIntersecting) {
          visibleSections.set(id, Math.abs(entry.boundingClientRect.top));
        } else {
          visibleSections.delete(id);
        }
      });

      if (visibleSections.size === 0) {
        return;
      }

      const [closestSectionId] = Array.from(visibleSections.entries()).sort((a, b) => a[1] - b[1])[0];
      setActiveLink(closestSectionId);
    },
    {
      rootMargin: "-30% 0px -55% 0px",
      threshold: 0,
    }
  );

  sectionTargets.forEach(({ section }) => sectionObserver.observe(section));
})();
