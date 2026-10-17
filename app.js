// Tiny helper shared by the site pages. No framework, no tracking.
// It reads config.json (a public copy of project.config.json) and fills in the page.
// If config.json can't be loaded, the pages still show safe defaults ("Not launched yet").
(function () {
  "use strict";

  // Solana addresses are base58 strings, 32-44 characters long.
  var BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  // Only ever link to https:// URLs, whatever is in the config.
  function safeUrl(value) {
    try {
      var url = new URL(value);
      return url.protocol === "https:" ? url.href : "";
    } catch (e) {
      return "";
    }
  }

  function setText(selector, value) {
    if (!value) return;
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = value;
    });
  }

  function showLink(name, href) {
    var link = document.querySelector('[data-link="' + name + '"]');
    if (!link || !href) return false;
    link.href = href;
    link.closest("li").hidden = false;
    return true;
  }

  function applyConfig(cfg) {
    var name = typeof cfg.name === "string" ? cfg.name : "";
    var ticker = typeof cfg.ticker === "string" ? cfg.ticker : "";
    var socials = cfg.socials && typeof cfg.socials === "object" ? cfg.socials : {};
    var mint = typeof cfg.mintAddress === "string" && BASE58.test(cfg.mintAddress) ? cfg.mintAddress : "";
    var dev = typeof cfg.devWallet === "string" && BASE58.test(cfg.devWallet) ? cfg.devWallet : "";

    setText('[data-config="name"]', name);
    setText('[data-config="ticker"]', ticker);
    var tagline = document.querySelector(".tagline");
    if (name && ticker && tagline) document.title = name + " ($" + ticker + ") — " + tagline.textContent;

    // Official links: each one is hidden unless it has a value.
    var any = false;
    any = showLink("website", safeUrl(socials.website)) || any;
    any = showLink("x", safeUrl(socials.x)) || any;
    any = showLink("telegram", safeUrl(socials.telegram)) || any;
    if (mint) any = showLink("pumpfun", "https://pump.fun/coin/" + mint) || any;
    var linksSection = document.getElementById("links");
    if (linksSection) linksSection.hidden = !any;

    // Contract address box: stays on the "not launched" text until a valid mint is set.
    var box = document.getElementById("ca-box");
    if (box && mint) {
      box.setAttribute("data-state", "live");
      document.getElementById("ca-value").textContent = mint;
      document.getElementById("copy-btn").disabled = false;
    }

    // Disclosure page: dev wallet is public by design.
    var devEl = document.getElementById("dev-wallet");
    if (devEl && dev) {
      devEl.textContent = dev;
      var devLink = document.getElementById("dev-wallet-link");
      if (devLink) {
        devLink.href = "https://explorer.solana.com/address/" + dev;
        devLink.hidden = false;
      }
    }
  }

  function setupCopy() {
    var btn = document.getElementById("copy-btn");
    if (!btn) return;
    var status = document.getElementById("ca-status");
    btn.addEventListener("click", function () {
      var text = document.getElementById("ca-value").textContent;
      function done(ok) {
        status.textContent = ok ? "Copied. Check it matches this page before you use it." : "Copy failed. Select the address and copy it by hand.";
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
        return;
      }
      // Older browsers: select the text in a temporary field and copy it.
      var field = document.createElement("textarea");
      field.value = text;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(field);
      done(ok);
    });
  }

  setupCopy();

  fetch("config.json", { cache: "no-cache" })
    .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error("config " + res.status)); })
    .then(applyConfig)
    .catch(function () { /* keep the safe defaults already in the HTML */ });
})();
