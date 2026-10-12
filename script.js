(() => {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  /* Reveal sections as they enter the screen. */

  if (
    "IntersectionObserver" in window &&
    !reducedMotion.matches
  ) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.remove("pending");
          entry.target.classList.add("shown");

          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.08
      }
    );

    document.querySelectorAll(".reveal").forEach((element) => {
      element.classList.add("pending");
      observer.observe(element);
    });

    reducedMotion.addEventListener("change", () => {
      if (!reducedMotion.matches) return;

      document.querySelectorAll(".pending").forEach((element) => {
        element.classList.remove("pending");
      });
    });
  }

  /* Gallery category filters. */

  const filters = document.querySelector(".gallery-filters");

  const categories = [
    ...document.querySelectorAll("[data-category]")
  ];

  function getVisiblePhotos() {
    return [
      ...document.querySelectorAll(".photo-open")
    ].filter((photo) => {
      const category = photo.closest("[data-category]");
      return category && !category.hidden;
    });
  }

  if (filters) {
    filters.hidden = false;

    filters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");

      if (!button) return;

      filters.querySelectorAll("button").forEach((filter) => {
        const active = filter === button;

        filter.classList.toggle("active", active);
        filter.setAttribute("aria-pressed", String(active));
      });

      categories.forEach((category) => {
        category.hidden =
          button.dataset.filter !== "all" &&
          category.dataset.category !== button.dataset.filter;
      });

      const status = document.querySelector(".gallery-status");

      if (status) {
        status.textContent =
          `${getVisiblePhotos().length} photos shown`;
      }
    });
  }

  /* Full-size photo viewer. */

  const dialog = document.querySelector(".lightbox");

  if (!dialog || typeof dialog.showModal !== "function") {
    return;
  }

  const image = dialog.querySelector(".lightbox-image");
  const previousButton = dialog.querySelector(".lightbox-prev");
  const nextButton = dialog.querySelector(".lightbox-next");
  const closeButton = dialog.querySelector(".lightbox-close");
  const caption = dialog.querySelector(".lightbox-caption");
  const count = dialog.querySelector(".lightbox-count");

  let photos = [];
  let currentIndex = 0;
  let openingLink = null;

  function displayPhoto() {
    const link = photos[currentIndex];
    const thumbnail = link.querySelector("img");

    image.src = link.href;
    image.alt = thumbnail.alt;

    caption.textContent = thumbnail.alt;
    count.textContent =
      `${currentIndex + 1} / ${photos.length}`;

    previousButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === photos.length - 1;
  }

  function changePhoto(direction) {
    const nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= photos.length) {
      return;
    }

    currentIndex = nextIndex;
    displayPhoto();
  }

  document.querySelectorAll(".photo-open").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();

      photos = getVisiblePhotos();
      currentIndex = photos.indexOf(link);
      openingLink = link;

      displayPhoto();
      dialog.showModal();

      document.body.classList.add("viewer-open");
      closeButton.focus();
    });
  });

  closeButton.addEventListener("click", () => {
    dialog.close();
  });

  previousButton.addEventListener("click", () => {
    changePhoto(-1);
  });

  nextButton.addEventListener("click", () => {
    changePhoto(1);
  });

  /* Arrow keys switch photos. Escape closes the dialog. */

  dialog.addEventListener("keydown", (event) => {
    if (
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight"
    ) {
      event.preventDefault();

      changePhoto(event.key === "ArrowRight" ? 1 : -1);
    }
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  dialog.addEventListener("close", () => {
    document.body.classList.remove("viewer-open");

    if (openingLink) {
      openingLink.focus();
    }

    image.removeAttribute("src");
  });

  /* Swipe left or right on the photo to navigate. */

  let touchStart = null;

  image.addEventListener(
    "touchstart",
    (event) => {
      touchStart = event.changedTouches[0].clientX;
    },
    {
      passive: true
    }
  );

  image.addEventListener(
    "touchend",
    (event) => {
      if (touchStart === null) return;

      const distance =
        event.changedTouches[0].clientX - touchStart;

      if (Math.abs(distance) > 55) {
        changePhoto(distance < 0 ? 1 : -1);
      }

      touchStart = null;
    },
    {
      passive: true
    }
  );

  image.addEventListener(
    "touchcancel",
    () => {
      touchStart = null;
    },
    {
      passive: true
    }
  );
})();