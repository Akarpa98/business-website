(() => {
  const toAbsoluteUrl = (path) => new URL(path, window.location.origin).toString();
  const setHeadMeta = (id, value) => {
    const node = document.getElementById(id);
    if (node && value) {
      node.setAttribute("content", value);
    }
  };

  const setCanonical = (path) => {
    const node = document.getElementById("canonical-url");
    if (node) {
      node.setAttribute("href", toAbsoluteUrl(path));
    }
  };

  const pagePath = window.location.pathname + window.location.search;
  setCanonical(pagePath);
  setHeadMeta("og-url", toAbsoluteUrl(pagePath));
  setHeadMeta("og-image", toAbsoluteUrl("/Images/remote1.jpg"));
  setHeadMeta("twitter-image", toAbsoluteUrl("/Images/remote1.jpg"));

  const supportsObserver = "IntersectionObserver" in window;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setupMobileHeaderCollapse = () => {
    const header = document.querySelector("header");
    const nav = header?.querySelector("nav");
    if (!header || !nav) {
      return;
    }

    const mobileQuery = window.matchMedia("(max-width: 768px)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lastScrollY = window.scrollY;
    let ticking = false;

    const setCollapsed = (shouldCollapse) => {
      document.body.classList.toggle("mobile-header-collapsed", shouldCollapse);
    };

    const updateHeaderState = () => {
      ticking = false;
      if (!mobileQuery.matches || reducedMotionQuery.matches) {
        setCollapsed(false);
        lastScrollY = window.scrollY;
        return;
      }

      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY;

      if (currentScrollY <= 20) {
        setCollapsed(false);
      } else if (scrollDelta > 8) {
        setCollapsed(true);
      } else if (scrollDelta < -6) {
        setCollapsed(false);
      }

      lastScrollY = currentScrollY;
    };

    const onScroll = () => {
      if (!mobileQuery.matches || reducedMotionQuery.matches) {
        return;
      }
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateHeaderState);
      }
    };

    const onViewportChange = () => {
      setCollapsed(false);
      lastScrollY = window.scrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    nav.addEventListener("click", () => {
      if (mobileQuery.matches) {
        setCollapsed(true);
      }
    });

    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener("change", onViewportChange);
      reducedMotionQuery.addEventListener("change", onViewportChange);
    } else {
      mobileQuery.addListener(onViewportChange);
      reducedMotionQuery.addListener(onViewportChange);
    }

    updateHeaderState();
  };

  setupMobileHeaderCollapse();

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
