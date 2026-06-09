(function () {
  const routes = {
    signIn: "/sign-in/",
    home: "/home/",
    addMedication: "/add-medication/",
    logMedication: "/log-medication/",
    caregiverDashboard: "/caregiver-dashboard/"
  };

  document.addEventListener("DOMContentLoaded", () => {
    wireLinks();
    wireBackButtons();
    wireForms();
    addSidebar();
    addCustomerBottomNav();
  });

  function wireLinks() {
    document.querySelectorAll("a").forEach((element) => {
      const text = normalizedText(element);
      const match = routeForText(text);
      if (!match) return;
      element.setAttribute("href", match);
    });
  }

  function wireBackButtons() {
    document.querySelectorAll("button").forEach((button) => {
      const icon = button.querySelector(".material-symbols-outlined")?.textContent?.trim();
      const label = button.getAttribute("aria-label") || "";
      if (icon !== "arrow_back" && !/go back/i.test(label)) return;

      button.addEventListener("click", (event) => {
        event.preventDefault();
        const fallback = location.pathname.includes("sign-in") ? routes.signIn : routes.home;
        if (history.length > 1) {
          history.back();
        } else {
          window.location.href = fallback;
        }
      });
    });
  }

  function wireForms() {
    document.querySelectorAll("form").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const message = document.createElement("p");
        message.className = "mt-4 rounded-2xl border-2 border-error-container bg-error-container p-4 text-base font-bold text-on-error-container";
        message.textContent = "Access requires authenticated household membership. Demo bypass navigation is disabled.";
        form.querySelector("[data-auth-disabled-message]")?.remove();
        message.dataset.authDisabledMessage = "true";
        form.appendChild(message);
      });
    });
  }

  function addSidebar() {
    if (document.querySelector("[data-mobile-demo-sidebar]")) return;

    const overlay = document.createElement("div");
    overlay.dataset.mobileDemoSidebar = "true";
    overlay.className = "fixed inset-0 z-[90] hidden bg-black/30";
    overlay.innerHTML = `
      <aside class="h-full w-[82vw] max-w-[360px] bg-surface px-6 py-8 shadow-2xl">
        <div class="mb-8 flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-bold uppercase tracking-widest text-secondary">Pilly</p>
            <h2 class="text-3xl font-bold text-primary">Mobile Demo</h2>
          </div>
          <button type="button" class="rounded-full border-2 border-outline-variant p-3 text-primary" data-close-sidebar aria-label="Close menu">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav class="grid gap-3">
          ${[
            ["Sign In", routes.signIn, "login"],
            ["Senior Home", routes.home, "home"],
            ["Add Medication", routes.addMedication, "add_circle"],
            ["Log Medication", routes.logMedication, "mic"],
            ["Caregiver Dashboard", routes.caregiverDashboard, "monitoring"]
          ].map(([label, path, icon]) => `
            <a href="${path}" class="flex min-h-16 items-center gap-4 rounded-2xl border-2 border-outline-variant bg-white px-5 py-4 text-xl font-bold text-on-surface">
              <span class="material-symbols-outlined text-primary">${icon}</span>
              <span>${label}</span>
            </a>
          `).join("")}
        </nav>
      </aside>
    `;

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay || event.target.closest("[data-close-sidebar]")) {
        overlay.classList.add("hidden");
      }
    });

    document.body.appendChild(overlay);

    document.querySelectorAll("button").forEach((button) => {
      const icon = button.querySelector(".material-symbols-outlined")?.textContent?.trim();
      if (icon !== "menu") return;
      button.addEventListener("click", (event) => {
        event.preventDefault();
        overlay.classList.remove("hidden");
      });
    });
  }

  function addCustomerBottomNav() {
    const customerPaths = [routes.home, routes.addMedication, routes.logMedication];
    if (!customerPaths.includes(location.pathname)) return;
    if (document.querySelector("[data-customer-bottom-nav]")) return;

    document.querySelectorAll("body > nav.fixed.bottom-10").forEach((nav) => {
      nav.setAttribute("hidden", "");
      nav.classList.add("hidden");
    });

    const nav = document.createElement("nav");
    nav.dataset.customerBottomNav = "true";
    nav.className = "fixed bottom-0 left-0 right-0 z-[70] border-t-2 border-outline-variant bg-surface-container-low px-4 pb-5 pt-3 shadow-[0_-4px_20px_rgba(74,101,73,0.15)]";
    nav.innerHTML = `
      <div class="mx-auto grid max-w-[560px] grid-cols-3 gap-2">
        ${[
          ["Home", routes.home, "home"],
          ["Add", routes.addMedication, "add_circle"],
          ["Log", routes.logMedication, "mic"]
        ].map(([label, path, icon]) => {
          const active = location.pathname === path;
          return `
            <a href="${path}" class="flex min-h-[64px] flex-col items-center justify-center rounded-2xl px-3 py-2 text-sm font-bold ${active ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant"}">
              <span class="material-symbols-outlined text-3xl">${icon}</span>
              <span>${label}</span>
            </a>
          `;
        }).join("")}
      </div>
    `;
    document.body.appendChild(nav);
  }

  function routeForText(text) {
    if (/^home$/i.test(text)) return routes.home;
    if (/^log$/i.test(text)) return routes.logMedication;
    if (/^add$/i.test(text)) return routes.addMedication;
    return "";
  }

  function normalizedText(element) {
    return (element.innerText || element.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
  }
})();
