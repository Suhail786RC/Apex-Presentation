"use strict";

const $ = id => document.getElementById(id);

const slides = Array.from(
  document.querySelectorAll(".slide")
);

const names = {
  Suhail: "Suhail Essack",
  Safwaan: "Safwaan Wadee",
  Abdullah: "Abdullah Lorgat"
};

const chapters = {
  "THE CONTEXT": "01",
  "THE ANALYSIS": "02",
  "THE SOLUTION": "03",
  "THE DELIVERY": "04",
  "THE DECISION": "05"
};

const pad = number => String(number).padStart(2, "0");

let current = 0;

/* Slide state */

function hashIndex() {
  const number = Number(location.hash.slice(1));

  return (
    Number.isInteger(number) &&
    number >= 1 &&
    number <= slides.length
  )
    ? number - 1
    : 0;
}

function presenterName(value) {
  return value
    .split(" / ")
    .map(name => names[name] || name)
    .join(" / ");
}

function showSlide(index, updateHash = true) {
  current = Math.max(
    0,
    Math.min(slides.length - 1, index)
  );

  slides.forEach((slide, index) => {
    const active = index === current;

    slide.classList.toggle("active", active);
    slide.setAttribute("aria-hidden", String(!active));
    slide.inert = !active;
  });

  const slide = slides[current];

  $("stage").scrollTop = 0;

  $("currentSlide").textContent = pad(current + 1);

  $("progress").style.width =
    `${(current + 1) / slides.length * 100}%`;

  $("chapterName").textContent =
    slide.dataset.chapter;

  $("chapterNumber").textContent =
    chapters[slide.dataset.chapter];

  $("speakerName").textContent =
    presenterName(slide.dataset.speaker);

  $("prevBtn").disabled = current === 0;

  $("nextBtn").disabled =
    current === slides.length - 1;

  $("announce").textContent =
    `Slide ${current + 1} of ${slides.length}: ` +
    slide.dataset.title;

  document.title =
    `${pad(current + 1)} — ${slide.dataset.title} / APEX`;

  const nextHash = `#${current + 1}`;

  if (updateHash && location.hash !== nextHash) {
    history.replaceState(null, "", nextHash);
  }

  document.querySelectorAll(".overview-tile").forEach(
    (button, index) => {
      const selected = index === current;

      button.classList.toggle("selected", selected);

      if (selected) {
        button.setAttribute("aria-current", "step");
      } else {
        button.removeAttribute("aria-current");
      }
    }
  );
}

/* Dialogs */

function openDialog(id) {
  document.querySelectorAll("dialog[open]").forEach(
    dialog => dialog.close()
  );

  $(id).showModal();
}

document.querySelectorAll("[data-close]").forEach(
  button => {
    button.addEventListener("click", () => {
      $(button.dataset.close).close();
    });
  }
);

document.querySelectorAll("dialog").forEach(dialog => {
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) {
      return;
    }

    const rect = dialog.getBoundingClientRect();

    const outside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (outside) {
      dialog.close();
    }
  });
});

/* Fullscreen */

async function fullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    } else {
      openDialog("help");
    }
  } catch {
    openDialog("help");
  }
}

/* Overview */

slides.forEach((slide, index) => {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "overview-tile";

  button.setAttribute(
    "aria-label",
    `Go to slide ${index + 1}: ${slide.dataset.title}`
  );

  const number = document.createElement("span");
  number.className = "tile-number";
  number.textContent = pad(index + 1);

  const title = document.createElement("span");
  title.className = "tile-title";
  title.textContent = slide.dataset.title;

  const chapter = document.createElement("small");
  chapter.textContent = slide.dataset.chapter;

  title.append(chapter);
  button.append(number, title);

  button.addEventListener("click", () => {
    showSlide(index);
    $("overview").close();
  });

  $("overviewGrid").append(button);
});

/* Navigation controls */

$("prevBtn").addEventListener("click", () => {
  showSlide(current - 1);
});

$("nextBtn").addEventListener("click", () => {
  showSlide(current + 1);
});

$("overviewBtn").addEventListener("click", () => {
  openDialog("overview");
});

$("sourcesBtn").addEventListener("click", () => {
  openDialog("sources");
});

$("helpBtn").addEventListener("click", () => {
  openDialog("help");
});

$("fullBtn").addEventListener("click", fullscreen);

/* Keyboard controls */

document.addEventListener("keydown", event => {
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.target.isContentEditable ||
    event.target.matches("input, textarea, select")
  ) {
    return;
  }

  if (document.querySelector("dialog[open]")) {
    return;
  }

  const key = event.key.toLowerCase();

  if (
    key === " " &&
    event.target.closest("button, a")
  ) {
    return;
  }

  if (["arrowright", "pagedown", " "].includes(key)) {
    event.preventDefault();
    showSlide(current + 1);
  } else if (["arrowleft", "pageup"].includes(key)) {
    event.preventDefault();
    showSlide(current - 1);
  } else if (key === "home") {
    event.preventDefault();
    showSlide(0);
  } else if (key === "end") {
    event.preventDefault();
    showSlide(slides.length - 1);
  } else if (key === "o") {
    openDialog("overview");
  } else if (key === "r") {
    openDialog("sources");
  } else if (key === "f") {
    fullscreen();
  } else if (key === "?") {
    openDialog("help");
  }
});

/* Touch controls */

let touchStart = null;

$("stage").addEventListener(
  "touchstart",
  event => {
    touchStart = event.touches.length === 1
      ? {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        }
      : null;
  },
  { passive: true }
);

$("stage").addEventListener(
  "touchend",
  event => {
    if (!touchStart) {
      return;
    }

    const deltaX =
      event.changedTouches[0].clientX - touchStart.x;

    const deltaY =
      event.changedTouches[0].clientY - touchStart.y;

    const diagram = event.target.closest(
      ".process-frame, .architecture-frame"
    );

    const horizontalSwipe =
      Math.abs(deltaX) > 85 &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.8;

    if (horizontalSwipe && !diagram) {
      showSlide(current + (deltaX < 0 ? 1 : -1));
    }

    touchStart = null;
  },
  { passive: true }
);

$("stage").addEventListener(
  "touchcancel",
  () => {
    touchStart = null;
  },
  { passive: true }
);

/* Deep links */

window.addEventListener("hashchange", () => {
  showSlide(hashIndex(), false);
});

/* Print support */

window.addEventListener("beforeprint", () => {
  slides.forEach(slide => {
    slide.inert = false;
    slide.setAttribute("aria-hidden", "false");
  });
});

window.addEventListener("afterprint", () => {
  showSlide(current, false);
});

/* Initialise */

showSlide(hashIndex(), false);